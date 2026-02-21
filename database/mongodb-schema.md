# DDAS MongoDB Schema (Atlas)

## Collections

### departments
- `_id` (ObjectId, PK)
- `name` (String, unique)
- `createdAt` (Date)

### users
- `_id` (ObjectId, PK)
- `usid` (String, unique, indexed)
- `name` (String)
- `email` (String, unique)
- `passwordHash` (String)
- `role` (`ADMIN | RESEARCHER | VIEWER`)
- `departmentId` (ObjectId, ref `departments`)
- `createdAt` / `updatedAt`

### usersessions
- `_id` (ObjectId, PK)
- `userId` (ObjectId, ref `users`)
- `tokenId` (String, unique)
- `ipAddress` (String)
- `userAgent` (String)
- `status` (`ACTIVE | LOGGED_OUT | REVOKED`)
- `loginAt` / `logoutAt`

### datasets
- `_id` (ObjectId, PK)
- `ownerId` (ObjectId, ref `users`)
- `name` (String)
- `filePath` (String)
- `sizeBytes` (Number)
- `status` (String)
- `sourceType` (`UPLOAD | BROWSER_DOWNLOAD`)
- `sourceUrl` (String)
- `sourceExternalId` (String)
- `sourceFingerprintHash` (String, index)
- `browserDownloadId` (String)
- `mimeType` (String)
- `downloadedAt` (Date)
- `deletedAt` (Date)
- `createdAt` / `updatedAt`

Indexes:
- Unique partial: `(ownerId, sourceExternalId)` when `sourceExternalId` exists

### shareddatasets
- `_id` (ObjectId, PK)
- `datasetId` (ObjectId, ref `datasets`)
- `ownerUserId` (ObjectId, ref `users`)
- `recipientUserId` (ObjectId, optional)
- `recipientDepartmentId` (ObjectId, optional)
- `shareType` (`USER | DEPARTMENT`)
- `sharedAt` / `revokedAt`

### accessrequests
- `_id` (ObjectId, PK)
- `datasetId` (ObjectId)
- `requesterUserId` (ObjectId)
- `requesterDepartmentId` (ObjectId)
- `reviewerUserId` (ObjectId)
- `note` (String)
- `status` (`PENDING | APPROVED | REJECTED`)
- `createdAt` / `reviewedAt`

### datasetlogs
- `_id` (ObjectId, PK)
- `datasetId` (ObjectId)
- `actorUserId` (ObjectId)
- `action` (String)
- `meta` (Mixed)
- `createdAt`

### duplicatedecisionlogs
- `_id` (ObjectId, PK)
- `actorUserId` (ObjectId)
- `requestedFileName` (String)
- `requestedFingerprintHash` (String)
- `duplicateDatasetId` (ObjectId)
- `decision` (`OPEN_EXISTING | CANCEL_DOWNLOAD | DOWNLOAD_ANYWAY`)
- `ipAddress` / `userAgent`
- `loggedAt`
