import { Router } from 'express';
import multer from 'multer';
import {
  details,
  download,
  duplicateCheck,
  duplicateDecision,
  ingestDownload,
  listOwn,
  remove,
  rename,
  upload
} from '../controllers/datasetController.js';
import { authorizeRoles } from '../middleware/authMiddleware.js';
import { requireFields } from '../middleware/validate.js';

const uploadMiddleware = multer({ dest: 'uploads/' });
const router = Router();

router.post('/upload', authorizeRoles('ADMIN', 'RESEARCHER'), uploadMiddleware.single('file'), upload);
router.post('/duplicate-check/browser-download', requireFields(['fileName']), duplicateCheck);
router.post('/duplicate-decision', requireFields(['fileName', 'decision']), duplicateDecision);
router.post('/ingest/browser-download', requireFields(['fileName']), ingestDownload);

router.get('/', listOwn);
router.get('/:id', details);
router.patch('/:id/rename', authorizeRoles('ADMIN', 'RESEARCHER'), requireFields(['name']), rename);
router.delete('/:id', authorizeRoles('ADMIN', 'RESEARCHER'), remove);
router.post('/:id/download', download);

export default router;
