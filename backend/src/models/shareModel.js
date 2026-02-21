import mongoose from 'mongoose';
import { Dataset, Department, SharedDataset, User } from './mongoSchemas.js';

const { Types } = mongoose;

function isObjectId(value) {
  return Types.ObjectId.isValid(value);
}

export async function shareWithUser({ datasetId, ownerId, recipientUserId }) {
  const updated = await SharedDataset.findOneAndUpdate(
    { datasetId, recipientUserId, shareType: 'USER' },
    {
      $set: {
        ownerUserId: ownerId,
        shareType: 'USER',
        revokedAt: null,
        sharedAt: new Date()
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    id: updated._id.toString(),
    dataset_id: updated.datasetId.toString(),
    recipient_user_id: updated.recipientUserId.toString(),
    shared_at: updated.sharedAt
  };
}

export async function shareWithDepartment({ datasetId, ownerId, departmentId }) {
  const updated = await SharedDataset.findOneAndUpdate(
    { datasetId, recipientDepartmentId: departmentId, shareType: 'DEPARTMENT' },
    {
      $set: {
        ownerUserId: ownerId,
        shareType: 'DEPARTMENT',
        revokedAt: null,
        sharedAt: new Date()
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    id: updated._id.toString(),
    dataset_id: updated.datasetId.toString(),
    recipient_department_id: updated.recipientDepartmentId.toString(),
    shared_at: updated.sharedAt
  };
}

export async function listSharedWithMe(userId, departmentId) {
  if (!isObjectId(userId)) return [];

  const shareOr = [{ recipientUserId: userId, revokedAt: null }];
  if (departmentId && isObjectId(departmentId)) {
    shareOr.push({ recipientDepartmentId: departmentId, revokedAt: null });
  }

  const shares = await SharedDataset.find({ $or: shareOr }).lean();
  const datasetIds = [...new Set(shares.map((s) => s.datasetId.toString()))];
  if (!datasetIds.length) return [];

  const datasets = await Dataset.find({ _id: { $in: datasetIds }, deletedAt: null }).sort({ createdAt: -1 }).lean();
  const ownerIds = [...new Set(datasets.map((d) => d.ownerId.toString()))];
  const owners = await User.find({ _id: { $in: ownerIds } }).select('name').lean();
  const ownerById = new Map(owners.map((o) => [o._id.toString(), o.name]));

  return datasets.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    size_bytes: d.sizeBytes,
    status: d.status,
    created_at: d.createdAt,
    owner_name: ownerById.get(d.ownerId.toString()) || 'Unknown'
  }));
}

export async function listSharedByMe(ownerId) {
  if (!isObjectId(ownerId)) return [];

  const shares = await SharedDataset.find({ ownerUserId: ownerId, revokedAt: null }).sort({ sharedAt: -1 }).lean();
  const datasetIds = [...new Set(shares.map((s) => s.datasetId.toString()))];
  const userIds = [...new Set(shares.filter((s) => s.recipientUserId).map((s) => s.recipientUserId.toString()))];
  const deptIds = [...new Set(shares.filter((s) => s.recipientDepartmentId).map((s) => s.recipientDepartmentId.toString()))];

  const [datasets, users, departments] = await Promise.all([
    Dataset.find({ _id: { $in: datasetIds }, deletedAt: null }).select('name').lean(),
    User.find({ _id: { $in: userIds } }).select('name').lean(),
    Department.find({ _id: { $in: deptIds } }).select('name').lean()
  ]);

  const datasetById = new Map(datasets.map((d) => [d._id.toString(), d.name]));
  const userById = new Map(users.map((u) => [u._id.toString(), u.name]));
  const deptById = new Map(departments.map((d) => [d._id.toString(), d.name]));

  return shares
    .filter((s) => datasetById.has(s.datasetId.toString()))
    .map((s) => ({
      share_id: s._id.toString(),
      recipient_name: s.recipientUserId
        ? userById.get(s.recipientUserId.toString()) || 'Unknown User'
        : deptById.get(s.recipientDepartmentId?.toString()) || 'Unknown Department',
      dataset_name: datasetById.get(s.datasetId.toString()),
      shared_at: s.sharedAt
    }));
}

export async function listDepartments() {
  const depts = await Department.find({}).sort({ name: 1 }).lean();
  return depts.map((dept) => ({ id: dept._id.toString(), name: dept.name }));
}
