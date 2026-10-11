import { z } from 'zod';

export const addChargeSchema = z.object({
  residentId: z.string().uuid(),
  type: z.enum(['ACCOMMODATION', 'ELECTRICITY', 'LAUNDRY', 'OTHER']),
  amount: z.coerce.number().positive(),
  period: z.string().min(4), // 'YYYY-MM'
});

export const addPaymentSchema = z.object({
  residentId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  description: z.string().min(1),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});
