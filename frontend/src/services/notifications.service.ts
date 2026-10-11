import { api } from './api';
import type { NotificationItem } from '@/types';

export function listMyNotifications() {
  return api.get<NotificationItem[]>('/notifications').then((r) => r.data);
}

export function markRead(id: string) {
  return api.put(`/notifications/${id}/read`);
}

export function markAllRead() {
  return api.put('/notifications/read-all');
}
