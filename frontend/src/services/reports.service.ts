import { api } from './api';

export interface AdminDashboardStats {
  totalBeds: number;
  occupiedBeds: number;
  occupancyRate: number;
  pendingApplications: number;
  openComplaints: number;
  residentsCount: number;
  visitorsToday: number;
  totalRevenue: number;
  totalOutstanding: number;
}

export function getAdminDashboard() {
  return api.get<AdminDashboardStats>('/admin/dashboard').then((r) => r.data);
}

export interface ReportsData {
  complaintsByCategory: { category: string; count: number }[];
  complaintsByStatus: { status: string; count: number }[];
  applicationsByStatus: { status: string; count: number }[];
  visitorsByStatus: { status: string; count: number }[];
}

export function getReports() {
  return api.get<ReportsData>('/admin/reports').then((r) => r.data);
}

export interface ResidentDashboardStats {
  room: { building: string; roomNumber: string; bedLabel: string } | null;
  balance: number;
  openComplaints: number;
  visitorsToday: number;
}

export function getResidentDashboard() {
  return api.get<ResidentDashboardStats>('/resident/dashboard').then((r) => r.data);
}
