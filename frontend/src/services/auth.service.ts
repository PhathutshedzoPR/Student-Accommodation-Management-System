import { api } from './api';
import type { Role } from '@/types';

export interface LoginResponse {
  token: string;
  refresh: string;
  role: Role;
  userId: string;
  email: string;
}

export function login(email: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data);
}

export interface RegisterPayload {
  email: string;
  password: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  course: string;
  school: string;
}

export function register(payload: RegisterPayload) {
  return api.post<LoginResponse>('/auth/register', payload).then((r) => r.data);
}

export function logout() {
  return api.post('/auth/logout').catch(() => undefined);
}
