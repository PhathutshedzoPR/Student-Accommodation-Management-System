import { prisma } from './prisma';
import type { NotificationType } from '@prisma/client';

/**
 * Create an in-app notification for a resident. In production you'd also
 * push this over a websocket / fan it out to email or SMS; this scaffold
 * just persists it so the resident sees it next time they load
 * /resident/notifications (and the dashboard bell count).
 */
export async function notifyResident(residentId: string, type: NotificationType, message: string) {
  return prisma.notification.create({
    data: { residentId, type, message },
  });
}
