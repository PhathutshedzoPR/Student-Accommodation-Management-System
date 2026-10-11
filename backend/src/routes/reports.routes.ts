import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { getAdminDashboard, getReports, getResidentDashboard } from '../controllers/reports.controller';

const router = Router();

router.get('/admin/dashboard', authenticate, requireRole('ADMIN'), getAdminDashboard);
router.get('/admin/reports', authenticate, requireRole('ADMIN'), getReports);
router.get('/resident/dashboard', authenticate, requireRole('RESIDENT'), getResidentDashboard);

export default router;
