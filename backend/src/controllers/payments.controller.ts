import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { addChargeSchema, addPaymentSchema } from '../validators/payment.validators';
import { getBalance } from '../services/accountService';
import { createAuditLog } from '../utils/audit';
import { notifyResident } from '../utils/notify';

async function residentIdForUser(userId: string) {
  const resident = await prisma.resident.findUnique({ where: { userId } });
  if (!resident) throw new ApiError(404, 'Resident profile not found');
  return resident.id;
}

// GET /api/account/balance — resident: { balance, charges[], payments[] }
export const getMyBalance = asyncHandler(async (req: Request, res: Response) => {
  const residentId = await residentIdForUser(req.user!.userId);
  res.json(await getBalance(residentId));
});

// GET /api/payments — resident payment history
export const getMyPayments = asyncHandler(async (req: Request, res: Response) => {
  const residentId = await residentIdForUser(req.user!.userId);
  const payments = await prisma.payment.findMany({ where: { residentId }, orderBy: { paidAt: 'desc' } });
  res.json(payments);
});

// GET /api/admin/residents/:id/balance — admin viewing one resident's ledger
export const getResidentBalance = asyncHandler(async (req: Request, res: Response) => {
  res.json(await getBalance(req.params.id));
});

// POST /api/admin/charges
export const addCharge = asyncHandler(async (req: Request, res: Response) => {
  const data = addChargeSchema.parse(req.body);
  const charge = await prisma.accountCharge.create({
    data: { residentId: data.residentId, type: data.type, amount: data.amount, period: data.period, addedBy: req.user!.userId },
  });
  await createAuditLog(req.user!.userId, 'CHARGE_ADDED', 'resident', data.residentId, null, {
    type: data.type,
    amount: data.amount,
    period: data.period,
  });
  await notifyResident(
    data.residentId,
    'PAYMENT',
    `💳 A new ${data.type.toLowerCase()} charge of R ${data.amount.toFixed(2)} was added for ${data.period}.`
  );
  res.status(201).json(charge);
});

// POST /api/admin/payments — admin records a payment received
export const addPayment = asyncHandler(async (req: Request, res: Response) => {
  const data = addPaymentSchema.parse(req.body);
  const payment = await prisma.payment.create({
    data: { residentId: data.residentId, amount: data.amount, description: data.description, recordedBy: req.user!.userId },
  });
  await createAuditLog(req.user!.userId, 'PAYMENT_RECORDED', 'resident', data.residentId, null, {
    amount: data.amount,
    description: data.description,
  });
  await notifyResident(data.residentId, 'PAYMENT', `✅ Payment of R ${data.amount.toFixed(2)} received — ${data.description}.`);
  res.status(201).json(payment);
});

// POST /api/payments/webhook — stub for a future payment gateway integration
// (Peach Payments / PayFast, per the build guide). Auto-records a payment
// from the gateway's callback payload.
export const paymentWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { residentId, amount, reference } = req.body as { residentId?: string; amount?: number; reference?: string };
  if (!residentId || !amount) throw new ApiError(400, 'residentId and amount are required');

  const payment = await prisma.payment.create({
    data: { residentId, amount, description: reference ? `Online payment — ${reference}` : 'Online payment' },
  });
  await notifyResident(residentId, 'PAYMENT', `✅ Online payment of R ${Number(amount).toFixed(2)} received.`);
  res.status(201).json(payment);
});
