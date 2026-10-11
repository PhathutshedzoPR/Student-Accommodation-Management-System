import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import * as authService from '@/services/auth.service';
import { setSession, clearSession, getToken, getRole, getEmail } from '@/services/api';
import type { Role } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
  email: string | null;
  login: (email: string, password: string) => Promise<Role>;
  register: (payload: authService.RegisterPayload) => Promise<Role>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>((getRole() as Role) ?? null);
  const [email, setEmail] = useState<string | null>(getEmail());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());

  const login = useCallback(async (emailInput: string, password: string) => {
    const res = await authService.login(emailInput, password);
    setSession(res.token, res.refresh, res.role, res.email);
    setRole(res.role);
    setEmail(res.email);
    setIsAuthenticated(true);
    return res.role;
  }, []);

  const register = useCallback(async (payload: authService.RegisterPayload) => {
    const res = await authService.register(payload);
    setSession(res.token, res.refresh, res.role, res.email);
    setRole(res.role);
    setEmail(res.email);
    setIsAuthenticated(true);
    return res.role;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    clearSession();
    setRole(null);
    setEmail(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, email, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
