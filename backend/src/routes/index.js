import { Router } from 'express';
import accessRequestRoutes from './accessRequestRoutes.js';
import authRoutes from './authRoutes.js';
import datasetRoutes from './datasetRoutes.js';
import searchRoutes from './searchRoutes.js';
import sharingRoutes from './sharingRoutes.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { departments } from '../controllers/sharingController.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/datasets', authenticate, datasetRoutes);
router.use('/sharing', authenticate, sharingRoutes);
router.use('/access-requests', authenticate, accessRequestRoutes);
router.use('/search', authenticate, searchRoutes);
router.get('/departments', authenticate, departments);

export default router;
