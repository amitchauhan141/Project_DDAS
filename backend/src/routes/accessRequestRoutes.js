import { Router } from 'express';
import {
  approve,
  create,
  list,
  reject
} from '../controllers/accessRequestController.js';
import { authorizeRoles } from '../middleware/authMiddleware.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

router.post('/', requireFields(['datasetId']), create);
router.get('/', list);
router.post('/:id/approve', authorizeRoles('ADMIN', 'RESEARCHER'), approve);
router.post('/:id/reject', authorizeRoles('ADMIN', 'RESEARCHER'), reject);

export default router;
