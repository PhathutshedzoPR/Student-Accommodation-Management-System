import { api } from './api';
import type { StaffUser } from '@/types';

export function listStaff() {
  return api.get<StaffUser[]>('/admin/staff').then((r) => r.data);
}

export function listAuditLogs(params: { targetType?: string; action?: string; q?: string; page?: number } = {}) {
  return api
    .get<{ items: any[]; total: number; page: number; totalPages: number }>('/admin/audit-logs', { params })
    .then((r) => r.data);
}
