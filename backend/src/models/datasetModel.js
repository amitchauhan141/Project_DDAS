import mongoose from 'mongoose';
import { createHash } from 'crypto';
import { Dataset, DatasetLog, DuplicateDecisionLog, SharedDataset, User } from './mongoSchemas.js';

const { Types } = mongoose;

function isObjectId(value) {
  return Types.ObjectId.isValid(value);
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function canonicalizeFileName(fileName = '') {
  const name = String(fileName || '').trim().toLowerCase();
  const extIndex = name.lastIndexOf('.');

  if (extIndex <= 0) {
    return name.replace(/\s*\(\d+\)$/, '').trim();
  }

  const base = name.slice(0, extIndex).replace(/\s*\(\d+\)$/, '').trim();
  const ext = name.slice(extIndex);
  return `${base}${ext}`;
}

function normalizeUrl(url = '') {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    return String(url).trim().toLowerCase();
  }
}

function normalizeFingerprintPayload(payload = {}) {
  return {
    fileName: canonicalizeFileName(payload.fileName || ''),
    sizeBytes: Number(payload.sizeBytes || 0),
    sourceUrl: normalizeUrl(payload.finalUrl || payload.sourceUrl || ''),
    mimeType: String(payload.mimeType || '').trim().toLowerCase()
  };
}

export function buildFingerprintHash(payload = {}) {
  const normalized = normalizeFingerprintPayload(payload);
  const raw = `${normalized.fileName}|${normalized.sizeBytes}|${normalized.sourceUrl}|${normalized.mimeType}`;
  return createHash('sha256').update(raw).digest('hex');
}

function toDatasetRow(doc, ownerName) {
  return {
    id: doc._id.toString(),
    owner_id: doc.ownerId?.toString(),
    name: doc.name,
    file_path: doc.filePath,
    size_bytes: doc.sizeBytes,
    status: doc.status,
    source_type: doc.sourceType || 'UPLOAD',
    source_url: doc.sourceUrl || null,
    mime_type: doc.mimeType || null,
    downloaded_at: doc.downloadedAt || null,
    created_at: doc.createdAt,
    owner_name: ownerName
  };
}

async function mapDuplicateResult(dataset) {
  if (!dataset) return null;
  const owner = await User.findById(dataset.ownerId).select('name usid').lean();
  return {
    dataset_id: dataset._id.toString(),
    file_name: dataset.name,
    existing_download_location: dataset.filePath,
    downloaded_by_user_name: owner?.name || 'Unknown',
    downloaded_by_usid: owner?.usid || 'Unknown',
    timestamp: dataset.downloadedAt || dataset.createdAt,
    browser_download_id: dataset.browserDownloadId || null
  };
}

export async function createDataset({ ownerId, name, filePath, sizeBytes, status = 'ACTIVE' }) {
  const created = await Dataset.create({
    ownerId,
    name,
    filePath,
    sizeBytes,
    status,
    sourceType: 'UPLOAD'
  });

  return {
    id: created._id.toString(),
    owner_id: created.ownerId.toString(),
    name: created.name,
    file_path: created.filePath,
    size_bytes: created.sizeBytes,
    status: created.status,
    created_at: created.createdAt
  };
}

export async function findDuplicateByFingerprint(fingerprintHash, excludeOwnerId = null) {
  if (!fingerprintHash) return null;

  const query = {
    sourceFingerprintHash: fingerprintHash,
    deletedAt: null
  };

  if (excludeOwnerId && isObjectId(excludeOwnerId)) {
    query.ownerId = { $ne: excludeOwnerId };
  }

  const dataset = await Dataset.findOne(query).sort({ downloadedAt: -1, createdAt: -1 }).lean();
  return mapDuplicateResult(dataset);
}

export async function findDuplicateByLooseMetadata(payload, excludeOwnerId = null) {
  const normalized = normalizeFingerprintPayload(payload);
  const hasUrl = Boolean(normalized.sourceUrl);
  const hasName = Boolean(normalized.fileName);

  if (!hasUrl && !hasName) return null;

  const query = { deletedAt: null };
  const or = [];

  if (hasUrl) {
    or.push({ sourceUrl: normalized.sourceUrl });
  }

  if (hasName) {
    const canonicalNoExt = normalized.fileName.replace(/\.[^.]+$/, '');
    or.push({
      name: {
        $regex: `^${escapeRegex(canonicalNoExt)}(?:\\s*\\(\\d+\\))?(?:\\.[^.]+)?$`,
        $options: 'i'
      }
    });
  }

  query.$or = or;

  if (normalized.sizeBytes > 0) {
    query.sizeBytes = normalized.sizeBytes;
  }

  if (excludeOwnerId && isObjectId(excludeOwnerId)) {
    query.ownerId = { $ne: excludeOwnerId };
  }

  const dataset = await Dataset.findOne(query).sort({ downloadedAt: -1, createdAt: -1 }).lean();
  return mapDuplicateResult(dataset);
}

export async function ingestBrowserDownload({
  ownerId,
  name,
  filePath,
  sizeBytes,
  sourceUrl,
  sourceExternalId,
  mimeType,
  downloadedAt,
  fingerprintHash,
  browserDownloadId
}) {
  const normalizedSourceUrl = normalizeUrl(sourceUrl || '');

  const filter = sourceExternalId
    ? { ownerId, sourceExternalId }
    : {
        ownerId,
        sourceFingerprintHash: fingerprintHash,
        name,
        sizeBytes,
        sourceType: 'BROWSER_DOWNLOAD'
      };

  const update = {
    $set: {
      ownerId,
      name,
      filePath,
      sizeBytes,
      status: 'ACTIVE',
      sourceType: 'BROWSER_DOWNLOAD',
      sourceUrl: normalizedSourceUrl || null,
      sourceExternalId: sourceExternalId || null,
      sourceFingerprintHash: fingerprintHash || null,
      browserDownloadId: browserDownloadId || null,
      mimeType: mimeType || null,
      downloadedAt: downloadedAt ? new Date(downloadedAt) : new Date()
    }
  };

  const doc = await Dataset.findOneAndUpdate(filter, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  }).lean();

  const owner = await User.findById(ownerId).select('name').lean();
  return toDatasetRow(doc, owner?.name || 'Unknown');
}

export async function logDuplicateDecision({
  actorUserId,
  fileName,
  fingerprintHash,
  duplicateDatasetId,
  decision,
  ipAddress,
  userAgent
}) {
  const created = await DuplicateDecisionLog.create({
    actorUserId,
    requestedFileName: fileName,
    requestedFingerprintHash: fingerprintHash,
    duplicateDatasetId: duplicateDatasetId || null,
    decision,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null
  });

  return {
    id: created._id.toString(),
    decision: created.decision,
    logged_at: created.loggedAt
  };
}

export async function listOwnDatasets(userId) {
  if (!isObjectId(userId)) return [];
  const docs = await Dataset.find({ ownerId: userId, deletedAt: null }).sort({ createdAt: -1 }).lean();
  const owner = await User.findById(userId).select('name').lean();
  return docs.map((doc) => toDatasetRow(doc, owner?.name || 'Unknown'));
}

export async function getDatasetById(datasetId, userId, departmentId = null) {
  if (!isObjectId(datasetId) || !isObjectId(userId)) return null;

  const dataset = await Dataset.findOne({ _id: datasetId, deletedAt: null }).lean();
  if (!dataset) return null;

  const ownAccess = dataset.ownerId.toString() === userId;

  let sharedAccess = false;
  if (!ownAccess) {
    const shareQuery = {
      datasetId,
      revokedAt: null,
      $or: [{ recipientUserId: userId }]
    };

    if (departmentId && isObjectId(departmentId)) {
      shareQuery.$or.push({ recipientDepartmentId: departmentId });
    }

    sharedAccess = Boolean(await SharedDataset.findOne(shareQuery).lean());
  }

  if (!ownAccess && !sharedAccess) return null;

  const owner = await User.findById(dataset.ownerId).select('name').lean();
  return toDatasetRow(dataset, owner?.name || 'Unknown');
}

export async function softDeleteDataset(datasetId, userId) {
  if (!isObjectId(datasetId) || !isObjectId(userId)) return null;

  const deleted = await Dataset.findOneAndUpdate(
    { _id: datasetId, ownerId: userId, deletedAt: null },
    { $set: { deletedAt: new Date(), status: 'DELETED' } },
    { new: true }
  ).lean();

  if (!deleted) return null;
  return { id: deleted._id.toString() };
}

export async function renameDataset(datasetId, userId, name) {
  if (!isObjectId(datasetId) || !isObjectId(userId)) return null;

  const updated = await Dataset.findOneAndUpdate(
    { _id: datasetId, ownerId: userId, deletedAt: null },
    { $set: { name } },
    { new: true }
  ).lean();

  if (!updated) return null;
  return { id: updated._id.toString(), name: updated.name };
}

export async function hasPriorDownload(datasetId, userId) {
  if (!isObjectId(datasetId) || !isObjectId(userId)) return false;
  const found = await DatasetLog.findOne({ datasetId, actorUserId: userId, action: 'DOWNLOAD' }).lean();
  return Boolean(found);
}

export async function logDownload(datasetId, userId) {
  await DatasetLog.create({ datasetId, actorUserId: userId, action: 'DOWNLOAD', meta: { source: 'api' } });
}

export async function searchDatasets(userId, departmentId, q) {
  if (!q?.trim() || !isObjectId(userId)) return [];

  const shareMatch = [{ recipientUserId: new Types.ObjectId(userId), revokedAt: null }];
  if (departmentId && isObjectId(departmentId)) {
    shareMatch.push({ recipientDepartmentId: new Types.ObjectId(departmentId), revokedAt: null });
  }

  const shares = await SharedDataset.find({ $or: shareMatch }).select('datasetId').lean();
  const sharedDatasetIds = shares.map((s) => s.datasetId);

  const docs = await Dataset.find({
    deletedAt: null,
    name: { $regex: q, $options: 'i' },
    $or: [{ ownerId: userId }, { _id: { $in: sharedDatasetIds } }]
  })
    .sort({ name: 1 })
    .limit(100)
    .lean();

  const ownerIds = [...new Set(docs.map((d) => d.ownerId.toString()))];
  const owners = await User.find({ _id: { $in: ownerIds } }).select('name').lean();
  const ownerById = new Map(owners.map((o) => [o._id.toString(), o.name]));

  return docs
    .map((doc) => toDatasetRow(doc, ownerById.get(doc.ownerId.toString()) || 'Unknown'))
    .sort((a, b) => {
      const qa = a.name.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
      const qb = b.name.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
      if (qa !== qb) return qa - qb;
      return a.name.localeCompare(b.name);
    });
}
