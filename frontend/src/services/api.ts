import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export const api = axios.create({ baseURL: API_URL });

export function getToken() {
  return localStorage.getItem('token');
}
export function getRefreshToken() {
  return localStorage.getItem('refresh');
}
export function getRole() {
  return localStorage.getItem('role');
}
export function getEmail() {
  return localStorage.getItem('email');
}
export function setSession(token: string, refresh: string | undefined, role: string, email?: string) {
  localStorage.setItem('token', token);
  if (refresh) localStorage.setItem('refresh', refresh);
  localStorage.setItem('role', role);
  if (email) localStorage.setItem('email', email);
}
export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');
  localStorage.removeItem('role');
  localStorage.removeItem('email');
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401 (expired access token), try the refresh token once before giving
// up and sending the user back to /login.
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retry && getRefreshToken()) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${API_URL}/auth/refresh`, { refresh: getRefreshToken() })
            .then((res) => {
              const { token, role } = res.data;
              setSession(token, undefined, role);
              return token as string;
            })
            .catch(() => {
              clearSession();
              return null;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const newToken = await refreshing;
        if (newToken) {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return api.request(original);
        }
      } catch {
        clearSession();
      }
    }

    if (error.response?.status === 401) {
      clearSession();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errors?: { path: string; message: string }[] } | undefined;
    if (data?.errors?.length) return data.errors.map((e) => e.message).join(', ');
    if (data?.message) return data.message;
  }
  return fallback;
}
