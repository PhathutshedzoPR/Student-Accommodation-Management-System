import { api } from './api';
import type { Visitor, IncidentReport } from '@/types';

export interface InviteVisitorPayload {
  visitorName: string;
  phone: string;
  idNumber: string;
  expectedDate: string;
  expectedFrom: string;
  expectedUntil: string;
  purpose: string;
}

export function inviteVisitor(payload: InviteVisitorPayload) {
  return api.post<Visitor>('/visitors', payload).then((r) => r.data);
}

export function listVisitors(params: { status?: string; date?: string; q?: string } = {}) {
  return api.get<Visitor[]>('/visitors', { params }).then((r) => r.data);
}

export function countVisitors(params: { date?: string } = {}) {
  return api.get<{ count: number }>('/visitors', { params: { ...params, count: 'true' } }).then((r) => r.data.count);
}

export function getVisitor(id: string) {
  return api.get<Visitor>(`/visitors/${id}`).then((r) => r.data);
}

export function checkInVisitor(id: string) {
  return api.post<Visitor>(`/visitors/${id}/check-in`).then((r) => r.data);
}

export function checkOutVisitor(id: string) {
  return api.post<Visitor>(`/visitors/${id}/check-out`).then((r) => r.data);
}

export function markNoShows() {
  return api.post<{ updated: number }>('/visitors/mark-no-shows').then((r) => r.data);
}

export function visitorHistory(params: { q?: string; dateFrom?: string; dateTo?: string } = {}) {
  return api.get<Visitor[]>('/admin/visitors/history', { params }).then((r) => r.data);
}

export function createIncident(payload: { visitorId?: string; residentId?: string; description: string; peopleInvolved?: string }) {
  return api.post<IncidentReport>('/incidents', payload).then((r) => r.data);
}

export function listIncidents() {
  return api.get<IncidentReport[]>('/incidents').then((r) => r.data);
}
