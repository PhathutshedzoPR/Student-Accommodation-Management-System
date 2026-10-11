import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export async function getBalance(residentId: string) {
  const [charges, payments] = await Promise.all([
    prisma.accountCharge.findMany({ where: { residentId }, orderBy: { createdAt: 'desc' } }),
    prisma.payment.findMany({ where: { residentId }, orderBy: { paidAt: 'desc' } }),
  ]);

  const totalCharges = charges.reduce((sum, c) => sum.plus(c.amount), new Prisma.Decimal(0));
  const totalPayments = payments.reduce((sum, p) => sum.plus(p.amount), new Prisma.Decimal(0));
  const balance = totalCharges.minus(totalPayments);

  return {
    balance: balance.toFixed(2),
    totalCharges: totalCharges.toFixed(2),
    totalPayments: totalPayments.toFixed(2),
    charges,
    payments,
  };
}
