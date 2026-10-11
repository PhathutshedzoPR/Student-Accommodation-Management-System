import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { listAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/announcements.controller';

const router = Router();

router.get('/announcements', authenticate, listAnnouncements);
router.post('/admin/announcements', authenticate, requireRole('ADMIN'), createAnnouncement);
router.delete('/admin/announcements/:id', authenticate, requireRole('ADMIN'), deleteAnnouncement);

export default router;
