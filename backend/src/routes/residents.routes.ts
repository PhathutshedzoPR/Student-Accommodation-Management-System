import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { getMe, updateMe, getMyAccommodation, listResidents, getResident } from '../controllers/residents.controller';

const router = Router();

// Resident-facing
router.get('/residents/me', authenticate, requireRole('RESIDENT'), getMe);
router.put('/residents/me', authenticate, requireRole('RESIDENT'), updateMe);
router.get('/residents/me/accommodation', authenticate, requireRole('RESIDENT'), getMyAccommodation);

// Admin-facing (search also used by Security when filing an incident report)
router.get('/admin/residents', authenticate, requireRole('ADMIN', 'SECURITY'), listResidents);
router.get('/admin/residents/:id', authenticate, requireRole('ADMIN'), getResident);

export default router;
