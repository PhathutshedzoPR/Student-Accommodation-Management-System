import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { listAuditLogs } from '../controllers/audit.controller';

const router = Router();

router.get('/admin/audit-logs', authenticate, requireRole('ADMIN'), listAuditLogs);

export default router;
