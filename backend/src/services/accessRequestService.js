import {
  createAccessRequest,
  getAccessRequestById,
  listIncomingAccessRequests,
  updateAccessRequestStatus
} from '../models/accessRequestModel.js';
import { shareWithDepartment } from '../models/shareModel.js';
import { ApiError } from '../utils/ApiError.js';

export async function requestDatasetAccess(payload) {
  return createAccessRequest(payload);
}

export async function listOwnerAccessRequests(ownerId) {
  return listIncomingAccessRequests(ownerId);
}

export async function approveAccessRequest(requestId, ownerId) {
  const req = await getAccessRequestById(requestId);
  if (!req) throw new ApiError(404, 'Access request not found');
  if (req.owner_id !== ownerId) throw new ApiError(403, 'You cannot review this request');

  const updated = await updateAccessRequestStatus(requestId, ownerId, 'APPROVED');
  if (!updated) throw new ApiError(409, 'Request is already reviewed');

  await shareWithDepartment({
    datasetId: updated.dataset_id,
    ownerId,
    departmentId: updated.requester_department_id
  });

  return updated;
}

export async function rejectAccessRequest(requestId, ownerId) {
  const req = await getAccessRequestById(requestId);
  if (!req) throw new ApiError(404, 'Access request not found');
  if (req.owner_id !== ownerId) throw new ApiError(403, 'You cannot review this request');

  const updated = await updateAccessRequestStatus(requestId, ownerId, 'REJECTED');
  if (!updated) throw new ApiError(409, 'Request is already reviewed');
  return updated;
}
