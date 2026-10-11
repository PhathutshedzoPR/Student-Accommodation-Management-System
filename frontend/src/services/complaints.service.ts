import { api } from './api';
import type { Complaint } from '@/types';

export interface CreateComplaintPayload {
  category: string;
  title: string;
  description: string;
  priority: string;
  photo?: File | null;
}

export function createComplaint(payload: CreateComplaintPayload) {
  const form = new FormData();
  form.append('category', payload.category);
  form.append('title', payload.title);
  form.append('description', payload.description);
  form.append('priority', payload.priority);
  if (payload.photo) form.append('photo', payload.photo);
  return api.post<Complaint>('/complaints', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
}

export function listComplaints(params: { status?: string; category?: string; priority?: string } = {}) {
  return api.get<Complaint[]>('/complaints', { params }).then((r) => r.data);
}

export function countComplaints(params: { status?: string } = {}) {
  return api.get<{ count: number }>('/complaints', { params: { ...params, count: 'true' } }).then((r) => r.data.count);
}

export function getComplaint(id: string) {
  return api.get<Complaint>(`/complaints/${id}`).then((r) => r.data);
}

export interface UpdateComplaintPayload {
  status?: string;
  priority?: string;
  assignedTo?: string | null;
  note?: string;
  photo?: File | null;
}

export function updateComplaint(id: string, payload: UpdateComplaintPayload) {
  const form = new FormData();
  if (payload.status) form.append('status', payload.status);
  if (payload.priority) form.append('priority', payload.priority);
  if (payload.assignedTo !== undefined) form.append('assignedTo', payload.assignedTo ?? '');
  if (payload.note) form.append('note', payload.note);
  if (payload.photo) form.append('photo', payload.photo);
  return api.put<Complaint>(`/complaints/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
}
