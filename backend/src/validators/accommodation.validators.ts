import { z } from 'zod';

export const createBuildingSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
});

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1),
  floor: z.coerce.number().int(),
  capacity: z.coerce.number().int().min(1).max(4),
  bedLabels: z.array(z.string()).optional(), // defaults to A, B, C... up to capacity
});

export const assignBedSchema = z.object({
  residentId: z.string().uuid(),
});
