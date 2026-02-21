import mongoose from 'mongoose';
import { AccessRequest, Dataset, Department } from './mongoSchemas.js';

const { Types } = mongoose;

function isObjectId(value) {
  return Types.ObjectId.isValid(value);
}

export async function createAccessRequest({ datasetId, requesterUserId, requesterDepartmentId, note }) {
  const created = await AccessRequest.create({
    datasetId,
    requesterUserId,
    requesterDepartmentId,
    note: note || null,
    status: 'PENDING'
  });

  return {
    id: created._id.toString(),
    dataset_id: created.datasetId.toString(),
    requester_user_id: created.requesterUserId.toString(),
    requester_department_id: created.requesterDepartmentId.toString(),
    status: created.status,
    created_at: created.createdAt
  };
}

export async function listIncomingAccessRequests(ownerId) {
  if (!isObjectId(ownerId)) return [];

  const ownedDatasets = await Dataset.find({ ownerId, deletedAt: null }).select('_id name').lean();
  const datasetById = new Map(ownedDatasets.map((d) => [d._id.toString(), d.name]));

  if (!datasetById.size) return [];

  const requests = await AccessRequest.find({
    datasetId: { $in: [...datasetById.keys()] },
    status: 'PENDING'
  })
    .sort({ createdAt: -1 })
    .lean();

  const departmentIds = [...new Set(requests.map((r) => r.requesterDepartmentId.toString()))];
  const departments = await Department.find({ _id: { $in: departmentIds } }).select('name').lean();
  const deptById = new Map(departments.map((d) => [d._id.toString(), d.name]));

  return requests.map((req) => ({
    id: req._id.toString(),
    status: req.status,
    note: req.note,
    created_at: req.createdAt,
    dataset_name: datasetById.get(req.datasetId.toString()) || 'Unknown Dataset',
    department_name: deptById.get(req.requesterDepartmentId.toString()) || 'Unknown Department'
  }));
}

export async function getAccessRequestById(requestId) {
  if (!isObjectId(requestId)) return null;

  const req = await AccessRequest.findById(requestId).lean();
  if (!req) return null;

  const dataset = await Dataset.findById(req.datasetId).select('ownerId').lean();
  if (!dataset) return null;

  return {
    id: req._id.toString(),
    dataset_id: req.datasetId.toString(),
    requester_department_id: req.requesterDepartmentId.toString(),
    status: req.status,
    owner_id: dataset.ownerId.toString()
  };
}

export async function updateAccessRequestStatus(requestId, ownerId, status) {
  if (!isObjectId(requestId) || !isObjectId(ownerId)) return null;

  const req = await AccessRequest.findOne({ _id: requestId, status: 'PENDING' }).lean();
  if (!req) return null;

  const dataset = await Dataset.findOne({ _id: req.datasetId, ownerId }).lean();
  if (!dataset) return null;

  const updated = await AccessRequest.findByIdAndUpdate(
    requestId,
    { $set: { status, reviewerUserId: ownerId, reviewedAt: new Date() } },
    { new: true }
  ).lean();

  return {
    id: updated._id.toString(),
    dataset_id: updated.datasetId.toString(),
    requester_department_id: updated.requesterDepartmentId.toString(),
    status: updated.status
  };
}
