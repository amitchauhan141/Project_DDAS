const STORAGE_KEYS = {
  config: 'ddas_config',
  synced: 'ddas_synced',
  pendingDuplicate: 'ddas_pending_duplicate'
};

function basename(filePath = '') {
  const normalized = String(filePath || '').replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1] || 'downloaded-file';
}

function getStorage(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function setStorage(payload) {
  return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
}

async function readConfig() {
  const { [STORAGE_KEYS.config]: config } = await getStorage([STORAGE_KEYS.config]);
  return config || null;
}

async function readPendingDuplicates() {
  const { [STORAGE_KEYS.pendingDuplicate]: pending = {} } = await getStorage([STORAGE_KEYS.pendingDuplicate]);
  return pending;
}

async function setPendingDuplicate(downloadId, data) {
  const pending = await readPendingDuplicates();
  pending[String(downloadId)] = data;
  await setStorage({ [STORAGE_KEYS.pendingDuplicate]: pending });
}

async function clearPendingDuplicate(downloadId) {
  const pending = await readPendingDuplicates();
  delete pending[String(downloadId)];
  await setStorage({ [STORAGE_KEYS.pendingDuplicate]: pending });
}

async function getPendingDuplicate(downloadId) {
  const pending = await readPendingDuplicates();
  return pending[String(downloadId)] || null;
}

async function markSynced(uniqueKey) {
  const { [STORAGE_KEYS.synced]: synced = {} } = await getStorage([STORAGE_KEYS.synced]);
  synced[uniqueKey] = Date.now();
  await setStorage({ [STORAGE_KEYS.synced]: synced });
}

async function wasSynced(uniqueKey) {
  const { [STORAGE_KEYS.synced]: synced = {} } = await getStorage([STORAGE_KEYS.synced]);
  return Boolean(synced[uniqueKey]);
}

function normalizeApiBase(url) {
  if (!url) return null;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function ddasPost(path, body) {
  const config = await readConfig();
  if (!config?.apiBaseUrl || !config?.jwtToken) {
    throw new Error('Extension is not configured with API URL and JWT token.');
  }

  const apiBaseUrl = normalizeApiBase(config.apiBaseUrl);
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.jwtToken}`
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `DDAS API error (${response.status})`);
  }

  return payload.data;
}

function buildDownloadPayload(downloadItem) {
  return {
    downloadId: String(downloadItem.id),
    fileName: basename(downloadItem.filename),
    localPath: downloadItem.filename || 'browser-download://path-unavailable',
    sizeBytes: downloadItem.fileSize || downloadItem.totalBytes || 0,
    sourceUrl: downloadItem.url || null,
    finalUrl: downloadItem.finalUrl || null,
    mimeType: downloadItem.mime || null,
    downloadedAt: downloadItem.endTime || new Date().toISOString()
  };
}

async function checkDuplicateBeforeDownload(downloadItem) {
  const config = await readConfig();
  if (!config?.apiBaseUrl || !config?.jwtToken) return;

  const payload = buildDownloadPayload(downloadItem);
  const result = await ddasPost('/datasets/duplicate-check/browser-download', payload);

  if (!result.duplicate) return;

  await chrome.downloads.pause(downloadItem.id);

  await setPendingDuplicate(downloadItem.id, {
    duplicateCheck: result,
    payload,
    createdAt: Date.now()
  });

  const popupUrl = chrome.runtime.getURL(`duplicate.html?downloadId=${downloadItem.id}`);
  await chrome.windows.create({
    url: popupUrl,
    type: 'popup',
    width: 520,
    height: 620
  });
}

async function recordDecision(downloadId, decision) {
  const context = await getPendingDuplicate(downloadId);
  if (!context) throw new Error('Duplicate context not found');

  return ddasPost('/datasets/duplicate-decision', {
    ...context.payload,
    decision,
    fingerprintHash: context.duplicateCheck?.fingerprintHash,
    duplicateDatasetId: context.duplicateCheck?.existing?.dataset_id || null
  });
}

async function openExistingFile(existing) {
  const browserIdRaw = existing?.browser_download_id;
  const browserId = browserIdRaw ? Number(browserIdRaw) : NaN;

  if (!Number.isNaN(browserId) && browserId > 0) {
    try {
      await chrome.downloads.open(browserId);
      return;
    } catch {
      // Fallback below.
    }
  }

  if (existing?.existing_download_location) {
    const matches = await chrome.downloads.search({ filenameRegex: existing.existing_download_location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') });
    if (matches?.[0]) {
      await chrome.downloads.open(matches[0].id);
    }
  }
}

async function handleDuplicateDecision(downloadId, decision) {
  const context = await getPendingDuplicate(downloadId);
  if (!context) throw new Error('Duplicate context not found for decision');

  if (decision === 'OPEN_EXISTING') {
    await recordDecision(downloadId, 'OPEN_EXISTING');
    await openExistingFile(context.duplicateCheck?.existing);
    await chrome.downloads.cancel(Number(downloadId));
    await clearPendingDuplicate(downloadId);
    return { ok: true, message: 'Opened existing file. New download canceled.' };
  }

  if (decision === 'CANCEL_DOWNLOAD') {
    await recordDecision(downloadId, 'CANCEL_DOWNLOAD');
    await chrome.downloads.cancel(Number(downloadId));
    await clearPendingDuplicate(downloadId);
    return { ok: true, message: 'Download canceled.' };
  }

  if (decision === 'DOWNLOAD_ANYWAY') {
    await recordDecision(downloadId, 'DOWNLOAD_ANYWAY');
    await chrome.downloads.resume(Number(downloadId));
    await clearPendingDuplicate(downloadId);
    return { ok: true, message: 'Download resumed.' };
  }

  throw new Error('Unsupported decision');
}

async function sendDownloadToDdas(downloadItem) {
  const config = await readConfig();
  if (!config?.apiBaseUrl || !config?.jwtToken) {
    return { ok: false, reason: 'Extension not configured with API URL/JWT token.' };
  }

  const uniqueKey = `${downloadItem.id}:${downloadItem.endTime || 'no-end-time'}`;

  if (await wasSynced(uniqueKey)) {
    return { ok: true, skipped: true, reason: 'Already synced.' };
  }

  await ddasPost('/datasets/ingest/browser-download', buildDownloadPayload(downloadItem));
  await markSynced(uniqueKey);
  return { ok: true, skipped: false };
}

async function syncRecentDownloads(limit = 30) {
  const items = await chrome.downloads.search({ state: 'complete', orderBy: ['-startTime'], limit });
  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const result = await sendDownloadToDdas(item);
      if (result.skipped) skipped += 1;
      else synced += 1;
    } catch (_err) {
      failed += 1;
    }
  }

  return { synced, skipped, failed };
}

chrome.runtime.onInstalled.addListener(async () => {
  const config = await readConfig();
  if (!config?.apiBaseUrl || !config?.jwtToken) {
    chrome.runtime.openOptionsPage();
  }
});

chrome.downloads.onCreated.addListener((downloadItem) => {
  checkDuplicateBeforeDownload(downloadItem).catch((err) => {
    console.error('[DDAS Extension] Duplicate check failed:', err);
  });
});

chrome.downloads.onChanged.addListener(async (delta) => {
  if (!delta.state || delta.state.current !== 'complete') return;

  try {
    const [downloadItem] = await chrome.downloads.search({ id: delta.id });
    if (!downloadItem) return;
    await sendDownloadToDdas(downloadItem);
  } catch (err) {
    console.error('[DDAS Extension] Sync failed:', err);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'DDAS_SYNC_RECENT') {
    syncRecentDownloads(30)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'DDAS_VALIDATE_CONFIG') {
    readConfig()
      .then((config) => {
        const ok = Boolean(config?.apiBaseUrl && config?.jwtToken);
        sendResponse({ ok, config });
      })
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'DDAS_GET_DUPLICATE_CONTEXT') {
    getPendingDuplicate(message.downloadId)
      .then((context) => sendResponse({ ok: true, context }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'DDAS_RESOLVE_DUPLICATE') {
    handleDuplicateDecision(message.downloadId, message.decision)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});
