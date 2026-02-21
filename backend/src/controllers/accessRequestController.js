import {
  approveAccessRequest,
  listOwnerAccessRequests,
  rejectAccessRequest,
  requestDatasetAccess
} from '../services/accessRequestService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
  const { datasetId, note } = req.body;
  const data = await requestDatasetAccess({
    datasetId,
    requesterUserId: req.user.id,
    requesterDepartmentId: req.user.departmentId,
    note
  });
  res.status(201).json({ success: true, data });
});

export const list = asyncHandler(async (req, res) => {
  const data = await listOwnerAccessRequests(req.user.id);
  res.json({ success: true, data });
});

export const approve = asyncHandler(async (req, res) => {
  const data = await approveAccessRequest(req.params.id, req.user.id);
  res.json({ success: true, data });
});

export const reject = asyncHandler(async (req, res) => {
  const data = await rejectAccessRequest(req.params.id, req.user.id);
  res.json({ success: true, data });
});
