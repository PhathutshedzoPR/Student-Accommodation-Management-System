import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { createAnnouncementSchema } from '../validators/payment.validators';

// GET /api/announcements — any authenticated user (residents see these on
// their dashboard / notifications feed)
export const listAnnouncements = asyncHandler(async (_req: Request, res: Response) => {
  const announcements = await prisma.announcement.findMany({
    include: { creator: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json(announcements);
});

// POST /api/admin/announcements
export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const data = createAnnouncementSchema.parse(req.body);
  const announcement = await prisma.announcement.create({
    data: { title: data.title, body: data.body, createdBy: req.user!.userId },
  });
  res.status(201).json(announcement);
});

// DELETE /api/admin/announcements/:id
export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Announcement not found');
  await prisma.announcement.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
