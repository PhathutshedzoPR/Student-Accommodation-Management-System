import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import {
  inviteVisitor,
  listVisitors,
  getVisitor,
  checkInVisitor,
  checkOutVisitor,
  visitorHistory,
  markNoShows,
  createIncident,
  listIncidents,
} from '../controllers/visitors.controller';

const router = Router();

router.post('/visitors', authenticate, requireRole('RESIDENT'), inviteVisitor);
router.get('/visitors', authenticate, requireRole('RESIDENT', 'ADMIN', 'SECURITY'), listVisitors);
router.post('/visitors/mark-no-shows', authenticate, requireRole('ADMIN', 'SECURITY'), markNoShows);
router.get('/visitors/:id', authenticate, requireRole('RESIDENT', 'ADMIN', 'SECURITY'), getVisitor);
router.post('/visitors/:id/check-in', authenticate, requireRole('SECURITY'), checkInVisitor);
router.post('/visitors/:id/check-out', authenticate, requireRole('SECURITY'), checkOutVisitor);

router.get('/admin/visitors/history', authenticate, requireRole('ADMIN', 'SECURITY'), visitorHistory);

router.post('/incidents', authenticate, requireRole('ADMIN', 'SECURITY'), createIncident);
router.get('/incidents', authenticate, requireRole('ADMIN', 'SECURITY'), listIncidents);

export default router;
