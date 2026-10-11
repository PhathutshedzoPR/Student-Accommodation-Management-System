import { z } from 'zod';

export const submitApplicationSchema = z.object({
  moveInDate: z.string().optional(),
  buildingPreference: z.string().optional(),
  roomTypePreference: z.string().optional(),
});

export const reviewApplicationSchema = z.object({
  action: z.enum(['VERIFY_DOCUMENTS', 'APPROVE', 'REJECT', 'ASSIGN_ROOM']),
  bedId: z.string().uuid().optional(),
  moveInDate: z.string().optional(),
  rejectionReason: z.string().optional(),
});
