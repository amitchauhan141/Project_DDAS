const fileNameNode = document.getElementById('fileName');
const locationNode = document.getElementById('location');
const userNode = document.getElementById('user');
const timestampNode = document.getElementById('timestamp');
const statusNode = document.getElementById('status');
const openExistingBtn = document.getElementById('openExisting');
const cancelDownloadBtn = document.getElementById('cancelDownload');
const downloadAnywayBtn = document.getElementById('downloadAnyway');

const params = new URLSearchParams(window.location.search);
const downloadId = params.get('downloadId');

function sendMessage(payload) {
  return new Promise((resolve) => chrome.runtime.sendMessage(payload, resolve));
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? '#9b221a' : '#31526b';
}

function disableButtons(disabled) {
  [openExistingBtn, cancelDownloadBtn, downloadAnywayBtn].forEach((btn) => {
    btn.disabled = disabled;
  });
}

async function resolveDecision(decision) {
  disableButtons(true);
  setStatus('Processing your selection...');

  const result = await sendMessage({
    type: 'DDAS_RESOLVE_DUPLICATE',
    downloadId,
    decision
  });

  if (!result?.ok) {
    disableButtons(false);
    setStatus(result?.error || 'Failed to process decision.', true);
    return;
  }

  setStatus(result.result.message || 'Done.');
  setTimeout(() => window.close(), 800);
}

async function loadContext() {
  if (!downloadId) {
    setStatus('Missing download id.', true);
    disableButtons(true);
    return;
  }

  const response = await sendMessage({
    type: 'DDAS_GET_DUPLICATE_CONTEXT',
    downloadId
  });

  if (!response?.ok || !response.context) {
    setStatus('Duplicate context not found. Download may have resumed.', true);
    disableButtons(true);
    return;
  }

  const existing = response.context.duplicateCheck?.existing;
  const payload = response.context.payload;

  fileNameNode.textContent = existing?.file_name || payload?.fileName || '-';
  locationNode.textContent = existing?.existing_download_location || '-';
  userNode.textContent = existing?.downloaded_by_user_name
    ? `${existing.downloaded_by_user_name} (${existing.downloaded_by_usid || 'N/A'})`
    : '-';
  timestampNode.textContent = existing?.timestamp ? new Date(existing.timestamp).toLocaleString() : '-';
}

openExistingBtn.addEventListener('click', () => resolveDecision('OPEN_EXISTING'));
cancelDownloadBtn.addEventListener('click', () => resolveDecision('CANCEL_DOWNLOAD'));
downloadAnywayBtn.addEventListener('click', () => {
  const confirmAnyway = window.confirm('Download anyway? This action will be logged for audit.');
  if (!confirmAnyway) return;
  resolveDecision('DOWNLOAD_ANYWAY');
});

loadContext();
