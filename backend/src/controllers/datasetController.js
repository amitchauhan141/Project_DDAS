import {
  checkDuplicateBrowserDownload,
  downloadDataset,
  getDataset,
  getOwnDatasets,
  ingestDatasetFromBrowser,
  recordDuplicateDecision,
  removeDataset,
  updateDatasetName,
  uploadDataset
} from '../services/datasetService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const upload = asyncHandler(async (req, res) => {
  const data = await uploadDataset(req.user.id, req.file, req.body.name);
  res.status(201).json({ success: true, data });
});

export const duplicateCheck = asyncHandler(async (req, res) => {
  const data = await checkDuplicateBrowserDownload(req.body);
  res.json({ success: true, data });
});

export const duplicateDecision = asyncHandler(async (req, res) => {
  const data = await recordDuplicateDecision(req.user.id, req.body, {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || null
  });
  res.status(201).json({ success: true, data });
});

export const ingestDownload = asyncHandler(async (req, res) => {
  const data = await ingestDatasetFromBrowser(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const listOwn = asyncHandler(async (req, res) => {
  const data = await getOwnDatasets(req.user.id);
  res.json({ success: true, data });
});

export const details = asyncHandler(async (req, res) => {
  const data = await getDataset(req.params.id, req.user.id, req.user.departmentId);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await removeDataset(req.params.id, req.user.id);
  res.json({ success: true, data });
});

export const download = asyncHandler(async (req, res) => {
  const data = await downloadDataset(req.params.id, req.user.id, req.user.departmentId);
  res.json({ success: true, data });
});

export const rename = asyncHandler(async (req, res) => {
  const data = await updateDatasetName(req.params.id, req.user.id, req.body.name);
  res.json({ success: true, data });
});
