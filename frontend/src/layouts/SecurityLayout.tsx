import { Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarClock, LogIn, LogOut, Users, History, ShieldAlert } from 'lucide-react';
import Sidebar, { type NavItem } from '@/components/Sidebar';
import { StaffIdentityFooter } from '@/components/IdentityFooter';
import { useAuth } from '@/context/AuthContext';

const navItems: NavItem[] = [
  { to: '/security/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/security/today', label: "Today's Visitors", icon: <CalendarClock size={18} /> },
  { to: '/security/check-in', label: 'Check In', icon: <LogIn size={18} /> },
  { to: '/security/check-out', label: 'Check Out', icon: <LogOut size={18} /> },
  { to: '/security/current', label: 'Current Visitors', icon: <Users size={18} /> },
  { to: '/security/history', label: 'Visitor History', icon: <History size={18} /> },
  { to: '/security/incidents', label: 'Incident Reports', icon: <ShieldAlert size={18} /> },
];

export default function SecurityLayout() {
  const { logout, email } = useAuth();

  return (
    <div className="flex h-screen">
      <Sidebar
        portalLabel="Security Portal"
        navItems={navItems}
        onLogout={logout}
        footer={<StaffIdentityFooter email={email ?? 'security@accommodation.test'} role="SECURITY" />}
      />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <Outlet />
      </main>
    </div>
  );
}
