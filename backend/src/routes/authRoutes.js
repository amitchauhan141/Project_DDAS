import { Router } from 'express';
import { login, logout } from '../controllers/authController.js';
import { requireFields } from '../middleware/validate.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', requireFields(['usid', 'password']), login);
router.post('/logout', authenticate, logout);

export default router;
