import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const inviteVisitorSchema = z.object({
  visitorName: z.string().min(1),
  phone: z.string().min(1),
  idNumber: z.string().min(4),
  expectedDate: z.string().min(1), // ISO date
  expectedFrom: z.string().regex(timeRegex, 'Use HH:mm'),
  expectedUntil: z.string().regex(timeRegex, 'Use HH:mm'),
  purpose: z.string().min(1),
});

export const incidentReportSchema = z.object({
  visitorId: z.string().optional(),
  residentId: z.string().uuid().optional(),
  description: z.string().min(5),
  peopleInvolved: z.string().optional(),
});
