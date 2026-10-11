import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { listMyNotifications, markRead, markAllRead } from '../controllers/notifications.controller';

const router = Router();

router.get('/notifications', authenticate, requireRole('RESIDENT'), listMyNotifications);
router.put('/notifications/:id/read', authenticate, requireRole('RESIDENT'), markRead);
router.put('/notifications/read-all', authenticate, requireRole('RESIDENT'), markAllRead);

export default router;
