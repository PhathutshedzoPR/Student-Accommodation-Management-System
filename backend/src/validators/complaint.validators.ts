import { z } from 'zod';

export const createComplaintSchema = z.object({
  category: z.enum([
    'PLUMBING',
    'ELECTRICAL',
    'LIFT',
    'INTERNET',
    'CLEANING',
    'SECURITY',
    'FURNITURE',
    'NOISE',
    'OTHER',
  ]),
  title: z.string().min(3),
  description: z.string().min(5),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export const updateComplaintSchema = z.object({
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  note: z.string().optional(),
});
