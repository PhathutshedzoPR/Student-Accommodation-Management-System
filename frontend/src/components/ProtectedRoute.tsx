import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';

interface Props {
  role: Role;
}

// Reads the JWT from localStorage (via useAuth/isAuthenticated) and checks
// the role claim matches the portal being requested. The backend enforces
// this for real on every API call (requireRole middleware) — this is just
// the UX layer that keeps a resident from ever seeing an admin shell.
export default function ProtectedRoute({ role }: Props) {
  const { isAuthenticated, role: currentRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentRole !== role) {
    const home: Record<Role, string> = {
      RESIDENT: '/resident/dashboard',
      ADMIN: '/admin/dashboard',
      SECURITY: '/security/dashboard',
    };
    return <Navigate to={currentRole ? home[currentRole] : '/login'} replace />;
  }

  return <Outlet />;
}
