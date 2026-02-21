import { getDatasetById } from '../models/datasetModel.js';
import {
  listDepartments,
  listSharedByMe,
  listSharedWithMe,
  shareWithDepartment,
  shareWithUser
} from '../models/shareModel.js';
import { ApiError } from '../utils/ApiError.js';

export async function shareDatasetWithUser(ownerId, datasetId, recipientUserId) {
  const dataset = await getDatasetById(datasetId, ownerId);
  if (!dataset || dataset.owner_id !== ownerId) throw new ApiError(403, 'Only dataset owner can share this dataset');
  if (ownerId === recipientUserId) throw new ApiError(400, 'Cannot share dataset with yourself');
  return shareWithUser({ datasetId, ownerId, recipientUserId });
}

export async function shareDatasetWithDepartment(ownerId, datasetId, departmentId) {
  const dataset = await getDatasetById(datasetId, ownerId);
  if (!dataset || dataset.owner_id !== ownerId) throw new ApiError(403, 'Only dataset owner can share this dataset');
  return shareWithDepartment({ datasetId, ownerId, departmentId });
}

export async function getSharedWithMe(userId, departmentId) {
  return listSharedWithMe(userId, departmentId);
}

export async function getSharedByMe(ownerId) {
  return listSharedByMe(ownerId);
}

export async function getDepartments() {
  return listDepartments();
}
