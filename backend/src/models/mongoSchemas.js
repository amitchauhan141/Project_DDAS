import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const departmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

const userSchema = new Schema(
  {
    usid: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'RESEARCHER', 'VIEWER'], default: 'VIEWER', index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' }
  },
  { timestamps: true }
);

const userSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenId: { type: String, required: true, unique: true, index: true },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    status: { type: String, enum: ['ACTIVE', 'LOGGED_OUT', 'REVOKED'], default: 'ACTIVE', index: true },
    loginAt: { type: Date, default: Date.now, index: true },
    logoutAt: { type: Date, default: null }
  },
  { timestamps: false }
);

const datasetSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    filePath: { type: String, required: true },
    sizeBytes: { type: Number, default: 0 },
    status: { type: String, default: 'ACTIVE' },
    sourceType: { type: String, enum: ['UPLOAD', 'BROWSER_DOWNLOAD'], default: 'UPLOAD', index: true },
    sourceUrl: { type: String, default: null },
    sourceExternalId: { type: String, default: null },
    sourceFingerprintHash: { type: String, default: null, index: true },
    browserDownloadId: { type: String, default: null },
    mimeType: { type: String, default: null },
    downloadedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

datasetSchema.index(
  { ownerId: 1, sourceExternalId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceExternalId: { $exists: true, $ne: null }
    }
  }
);

const sharedDatasetSchema = new Schema(
  {
    datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', required: true, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    recipientDepartmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    shareType: { type: String, enum: ['USER', 'DEPARTMENT'], required: true },
    sharedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null }
  },
  { timestamps: false }
);

sharedDatasetSchema.index(
  { datasetId: 1, recipientUserId: 1, shareType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      recipientUserId: { $exists: true, $ne: null },
      shareType: 'USER'
    }
  }
);

sharedDatasetSchema.index(
  { datasetId: 1, recipientDepartmentId: 1, shareType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      recipientDepartmentId: { $exists: true, $ne: null },
      shareType: 'DEPARTMENT'
    }
  }
);

const accessRequestSchema = new Schema(
  {
    datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', required: true, index: true },
    requesterUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requesterDepartmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    reviewerUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: null },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

const datasetLogSchema = new Schema(
  {
    datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', required: true, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    meta: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

datasetLogSchema.index(
  { datasetId: 1, actorUserId: 1, action: 1 },
  { unique: true, partialFilterExpression: { action: 'DOWNLOAD' } }
);

const duplicateDecisionLogSchema = new Schema(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestedFileName: { type: String, required: true },
    requestedFingerprintHash: { type: String, required: true, index: true },
    duplicateDatasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', default: null },
    decision: {
      type: String,
      enum: ['OPEN_EXISTING', 'CANCEL_DOWNLOAD', 'DOWNLOAD_ANYWAY'],
      required: true,
      index: true
    },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    loggedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

export const Department = models.Department || model('Department', departmentSchema);
export const User = models.User || model('User', userSchema);
export const UserSession = models.UserSession || model('UserSession', userSessionSchema);
export const Dataset = models.Dataset || model('Dataset', datasetSchema);
export const SharedDataset = models.SharedDataset || model('SharedDataset', sharedDatasetSchema);
export const AccessRequest = models.AccessRequest || model('AccessRequest', accessRequestSchema);
export const DatasetLog = models.DatasetLog || model('DatasetLog', datasetLogSchema);
export const DuplicateDecisionLog = models.DuplicateDecisionLog || model('DuplicateDecisionLog', duplicateDecisionLogSchema);
