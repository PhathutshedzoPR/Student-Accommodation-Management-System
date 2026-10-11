import { api } from './api';
import type { Balance, Payment } from '@/types';

export function getMyBalance() {
  return api.get<Balance>('/account/balance').then((r) => r.data);
}

export function getMyPayments() {
  return api.get<Payment[]>('/payments').then((r) => r.data);
}

export function getResidentBalance(residentId: string) {
  return api.get<Balance>(`/admin/residents/${residentId}/balance`).then((r) => r.data);
}

export function addCharge(data: { residentId: string; type: string; amount: number; period: string }) {
  return api.post('/admin/charges', data).then((r) => r.data);
}

export function addPayment(data: { residentId: string; amount: number; description: string }) {
  return api.post('/admin/payments', data).then((r) => r.data);
}
