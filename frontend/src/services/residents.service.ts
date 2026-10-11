import { api } from './api';
import type { Resident } from '@/types';

export function getMe() {
  return api.get<Resident>('/residents/me').then((r) => r.data);
}

export function updateMe(data: Partial<Pick<Resident, 'phone' | 'course' | 'school'>>) {
  return api.put<Resident>('/residents/me', data).then((r) => r.data);
}

export interface MyAccommodation {
  assigned: boolean;
  building?: string;
  roomNumber?: string;
  floor?: number;
  bedLabel?: string;
  moveInDate?: string | null;
}

export function getMyAccommodation() {
  return api.get<MyAccommodation>('/residents/me/accommodation').then((r) => r.data);
}

export function listResidents(params: { q?: string; unassigned?: boolean } = {}) {
  return api.get<Resident[]>('/admin/residents', { params }).then((r) => r.data);
}

export function getResident(id: string) {
  return api.get<Resident>(`/admin/residents/${id}`).then((r) => r.data);
}
