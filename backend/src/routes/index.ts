import { Router } from 'express';
import authRoutes from './auth.routes';
import residentsRoutes from './residents.routes';
import applicationsRoutes from './applications.routes';
import accommodationRoutes from './accommodation.routes';
import paymentsRoutes from './payments.routes';
import complaintsRoutes from './complaints.routes';
import visitorsRoutes from './visitors.routes';
import auditRoutes from './audit.routes';
import announcementsRoutes from './announcements.routes';
import notificationsRoutes from './notifications.routes';
import reportsRoutes from './reports.routes';
import usersRoutes from './users.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use(residentsRoutes);
router.use(applicationsRoutes);
router.use(accommodationRoutes);
router.use(paymentsRoutes);
router.use(complaintsRoutes);
router.use(visitorsRoutes);
router.use(auditRoutes);
router.use(announcementsRoutes);
router.use(notificationsRoutes);
router.use(reportsRoutes);
router.use(usersRoutes);

export default router;
