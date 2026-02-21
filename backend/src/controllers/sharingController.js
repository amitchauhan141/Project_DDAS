import {
  getDepartments,
  getSharedByMe,
  getSharedWithMe,
  shareDatasetWithDepartment,
  shareDatasetWithUser
} from '../services/sharingService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const shareUser = asyncHandler(async (req, res) => {
  const { datasetId, recipientUserId } = req.body;
  const data = await shareDatasetWithUser(req.user.id, datasetId, recipientUserId);
  res.status(201).json({ success: true, data });
});

export const shareDepartment = asyncHandler(async (req, res) => {
  const { datasetId, departmentId } = req.body;
  const data = await shareDatasetWithDepartment(req.user.id, datasetId, departmentId);
  res.status(201).json({ success: true, data });
});

export const withMe = asyncHandler(async (req, res) => {
  const data = await getSharedWithMe(req.user.id, req.user.departmentId);
  res.json({ success: true, data });
});

export const byMe = asyncHandler(async (req, res) => {
  const data = await getSharedByMe(req.user.id);
  res.json({ success: true, data });
});

export const departments = asyncHandler(async (_req, res) => {
  const data = await getDepartments();
  res.json({ success: true, data });
});
