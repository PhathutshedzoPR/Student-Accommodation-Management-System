import { api } from './api';
import type { Application, Bed } from '@/types';

export interface SubmitApplicationPayload {
  moveInDate?: string;
  buildingPreference?: string;
  roomTypePreference?: string;
}

export function submitApplication(payload: SubmitApplicationPayload) {
  return api.post<Application>('/applications', payload).then((r) => r.data);
}

export function uploadApplicationDocument(applicationId: string, type: string, file: File) {
  const form = new FormData();
  form.append('type', type);
  form.append('file', file);
  return api
    .post(`/applications/${applicationId}/documents`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
}

export function getMyApplication() {
  return api.get<Application | null>('/applications/me').then((r) => r.data);
}

export function listApplications(params: { status?: string; page?: number } = {}) {
  return api
    .get<{ items: Application[]; total: number; page: number; totalPages: number }>('/admin/applications', { params })
    .then((r) => r.data);
}

export function getApplication(id: string) {
  return api.get<Application>(`/admin/applications/${id}`).then((r) => r.data);
}

export function listAvailableBeds() {
  return api.get<Bed[]>('/admin/beds/available').then((r) => r.data);
}

export type ReviewAction = 'VERIFY_DOCUMENTS' | 'APPROVE' | 'REJECT' | 'ASSIGN_ROOM';

export function reviewApplication(
  id: string,
  payload: { action: ReviewAction; bedId?: string; moveInDate?: string; rejectionReason?: string }
) {
  return api.put<Application>(`/admin/applications/${id}`, payload).then((r) => r.data);
}
