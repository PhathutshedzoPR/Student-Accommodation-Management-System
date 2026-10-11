import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { listStaff } from '../controllers/users.controller';

const router = Router();

router.get('/admin/staff', authenticate, requireRole('ADMIN'), listStaff);

export default router;
