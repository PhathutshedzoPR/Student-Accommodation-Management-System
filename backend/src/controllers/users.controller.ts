import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/errorHandler';

// GET /api/admin/staff — admin + security users, for the "assign staff
// member" dropdown on the complaints page.
export const listStaff = asyncHandler(async (_req: Request, res: Response) => {
  const staff = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SECURITY'] } },
    select: { id: true, email: true, role: true },
    orderBy: { email: 'asc' },
  });
  res.json(staff);
});
