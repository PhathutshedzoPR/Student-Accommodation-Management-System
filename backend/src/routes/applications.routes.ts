import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { upload } from '../utils/upload';
import {
  submitApplication,
  uploadApplicationDocument,
  getMyApplication,
  listApplications,
  getApplication,
  reviewApplication,
  listAvailableBeds,
} from '../controllers/applications.controller';

const router = Router();

// Resident-facing
router.post('/applications', authenticate, requireRole('RESIDENT'), submitApplication);
router.post(
  '/applications/:id/documents',
  authenticate,
  requireRole('RESIDENT'),
  upload.single('file'),
  uploadApplicationDocument
);
router.get('/applications/me', authenticate, requireRole('RESIDENT'), getMyApplication);

// Admin-facing
router.get('/admin/applications', authenticate, requireRole('ADMIN'), listApplications);
router.get('/admin/applications/:id', authenticate, requireRole('ADMIN'), getApplication);
router.put('/admin/applications/:id', authenticate, requireRole('ADMIN'), reviewApplication);
router.get('/admin/beds/available', authenticate, requireRole('ADMIN'), listAvailableBeds);

export default router;
