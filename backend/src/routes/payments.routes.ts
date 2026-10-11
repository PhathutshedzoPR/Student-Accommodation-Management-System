import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import {
  getMyBalance,
  getMyPayments,
  getResidentBalance,
  addCharge,
  addPayment,
  paymentWebhook,
} from '../controllers/payments.controller';

const router = Router();

// Resident-facing
router.get('/account/balance', authenticate, requireRole('RESIDENT'), getMyBalance);
router.get('/payments', authenticate, requireRole('RESIDENT'), getMyPayments);

// Admin-facing
router.get('/admin/residents/:id/balance', authenticate, requireRole('ADMIN'), getResidentBalance);
router.post('/admin/charges', authenticate, requireRole('ADMIN'), addCharge);
router.post('/admin/payments', authenticate, requireRole('ADMIN'), addPayment);

// Public webhook (payment gateway callback — in production, verify its
// signature here before trusting the payload)
router.post('/payments/webhook', paymentWebhook);

export default router;
