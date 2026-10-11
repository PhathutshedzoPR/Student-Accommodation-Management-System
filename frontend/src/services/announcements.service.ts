import { api } from './api';
import type { Announcement } from '@/types';

export function listAnnouncements() {
  return api.get<Announcement[]>('/announcements').then((r) => r.data);
}

export function createAnnouncement(data: { title: string; body: string }) {
  return api.post<Announcement>('/admin/announcements', data).then((r) => r.data);
}

export function deleteAnnouncement(id: string) {
  return api.delete(`/admin/announcements/${id}`);
}
