import {
  buildFingerprintHash,
  createDataset,
  findDuplicateByFingerprint,
  findDuplicateByLooseMetadata,
  getDatasetById,
  hasPriorDownload,
  ingestBrowserDownload,
  listOwnDatasets,
  logDownload,
  logDuplicateDecision,
  renameDataset,
  searchDatasets,
  softDeleteDataset
} from '../models/datasetModel.js';
import { ApiError } from '../utils/ApiError.js';

function buildDuplicatePayloadFingerprint(payload) {
  return buildFingerprintHash({
    fileName: payload.fileName,
    sizeBytes: payload.sizeBytes,
    sourceUrl: payload.sourceUrl,
    finalUrl: payload.finalUrl,
    mimeType: payload.mimeType
  });
}

export async function uploadDataset(userId, file, name) {
  if (!file) throw new ApiError(400, 'Dataset file is required');
  const created = await createDataset({
    ownerId: userId,
    name: name || file.originalname,
    filePath: file.path,
    sizeBytes: file.size
  });
  return created;
}

export async function checkDuplicateBrowserDownload(payload) {
  const fileName = payload.fileName?.trim();
  if (!fileName) throw new ApiError(400, 'fileName is required');

  const fingerprintHash = buildDuplicatePayloadFingerprint(payload);
  let duplicate = await findDuplicateByFingerprint(fingerprintHash);

  if (!duplicate) {
    duplicate = await findDuplicateByLooseMetadata(payload);
  }

  return {
    duplicate: Boolean(duplicate),
    fingerprintHash,
    existing: duplicate
  };
}

export async function recordDuplicateDecision(userId, payload, requestMeta) {
  const fileName = payload.fileName?.trim();
  if (!fileName) throw new ApiError(400, 'fileName is required');
  if (!payload.decision) throw new ApiError(400, 'decision is required');

  const fingerprintHash = payload.fingerprintHash || buildDuplicatePayloadFingerprint(payload);

  const data = await logDuplicateDecision({
    actorUserId: userId,
    fileName,
    fingerprintHash,
    duplicateDatasetId: payload.duplicateDatasetId || null,
    decision: payload.decision,
    ipAddress: requestMeta?.ipAddress || null,
    userAgent: requestMeta?.userAgent || null
  });

  return data;
}

export async function ingestDatasetFromBrowser(userId, payload) {
  const name = payload.fileName?.trim();
  if (!name) throw new ApiError(400, 'fileName is required');

  const fingerprintHash = buildDuplicatePayloadFingerprint(payload);

  const data = await ingestBrowserDownload({
    ownerId: userId,
    name,
    filePath: payload.localPath || 'browser-download://unresolved-path',
    sizeBytes: Number(payload.sizeBytes || 0),
    sourceUrl: payload.sourceUrl || payload.finalUrl || null,
    sourceExternalId: payload.downloadId ? String(payload.downloadId) : null,
    mimeType: payload.mimeType || null,
    downloadedAt: payload.downloadedAt || new Date().toISOString(),
    fingerprintHash,
    browserDownloadId: payload.downloadId ? String(payload.downloadId) : null
  });

  return data;
}

export async function getOwnDatasets(userId) {
  return listOwnDatasets(userId);
}

export async function getDataset(datasetId, userId, departmentId = null) {
  const dataset = await getDatasetById(datasetId, userId, departmentId);
  if (!dataset) throw new ApiError(404, 'Dataset not found or access denied');
  return dataset;
}

export async function removeDataset(datasetId, userId) {
  const deleted = await softDeleteDataset(datasetId, userId);
  if (!deleted) throw new ApiError(404, 'Dataset not found or not owned by user');
  return deleted;
}

export async function downloadDataset(datasetId, userId, departmentId = null) {
  const dataset = await getDataset(datasetId, userId, departmentId);
  const duplicate = await hasPriorDownload(datasetId, userId);
  if (duplicate) throw new ApiError(409, 'Duplicate download prevented: dataset already downloaded by this user');

  await logDownload(datasetId, userId);
  return {
    datasetId: dataset.id,
    filePath: dataset.file_path,
    message: 'Download registered. Use signed URL generation in production.'
  };
}

export async function updateDatasetName(datasetId, userId, name) {
  if (!name?.trim()) throw new ApiError(400, 'Dataset name cannot be empty');
  const updated = await renameDataset(datasetId, userId, name.trim());
  if (!updated) throw new ApiError(404, 'Dataset not found or not owned by user');
  return updated;
}

export async function searchAccessibleDatasets(userId, departmentId, query) {
  if (!query?.trim()) return [];
  return searchDatasets(userId, departmentId, query.trim());
}
