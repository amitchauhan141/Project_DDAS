import { Router } from 'express';
import {
  byMe,
  departments,
  shareDepartment,
  shareUser,
  withMe
} from '../controllers/sharingController.js';
import { authorizeRoles } from '../middleware/authMiddleware.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

router.post('/user', authorizeRoles('ADMIN', 'RESEARCHER'), requireFields(['datasetId', 'recipientUserId']), shareUser);
router.post(
  '/department',
  authorizeRoles('ADMIN', 'RESEARCHER'),
  requireFields(['datasetId', 'departmentId']),
  shareDepartment
);
router.get('/with-me', withMe);
router.get('/by-me', byMe);
router.get('/departments', departments);

export default router;
