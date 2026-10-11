import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

async function residentIdForUser(userId: string) {
  const resident = await prisma.resident.findUnique({ where: { userId } });
  if (!resident) throw new ApiError(404, 'Resident profile not found');
  return resident.id;
}

// GET /api/notifications — resident's own notification feed
export const listMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const residentId = await residentIdForUser(req.user!.userId);
  const notifications = await prisma.notification.findMany({
    where: { residentId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
});

// PUT /api/notifications/:id/read
export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const residentId = await residentIdForUser(req.user!.userId);
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.residentId !== residentId) throw new ApiError(404, 'Notification not found');

  const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
  res.json(updated);
});

// PUT /api/notifications/read-all
export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const residentId = await residentIdForUser(req.user!.userId);
  await prisma.notification.updateMany({ where: { residentId, read: false }, data: { read: true } });
  res.json({ message: 'All notifications marked as read' });
});
