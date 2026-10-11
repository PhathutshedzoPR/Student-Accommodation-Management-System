import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { upload } from '../utils/upload';
import { createComplaint, listComplaints, getComplaint, updateComplaint } from '../controllers/complaints.controller';

const router = Router();

router.post('/complaints', authenticate, requireRole('RESIDENT'), upload.single('photo'), createComplaint);
router.get('/complaints', authenticate, requireRole('RESIDENT', 'ADMIN'), listComplaints);
router.get('/complaints/:id', authenticate, requireRole('RESIDENT', 'ADMIN'), getComplaint);
router.put('/complaints/:id', authenticate, requireRole('ADMIN'), upload.single('photo'), updateComplaint);

export default router;
