import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  BedDouble,
  Receipt,
  Wrench,
  UserCheck,
  Megaphone,
  ScrollText,
  BarChart3,
} from 'lucide-react';
import Sidebar, { type NavItem } from '@/components/Sidebar';
import { StaffIdentityFooter } from '@/components/IdentityFooter';
import { useAuth } from '@/context/AuthContext';

const navItems: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/admin/applications', label: 'Applications', icon: <FileText size={18} /> },
  { to: '/admin/residents', label: 'Residents', icon: <Users size={18} /> },
  { to: '/admin/rooms', label: 'Rooms', icon: <BedDouble size={18} /> },
  { to: '/admin/payments', label: 'Payments', icon: <Receipt size={18} /> },
  { to: '/admin/complaints', label: 'Complaints', icon: <Wrench size={18} /> },
  { to: '/admin/visitors', label: 'Visitors', icon: <UserCheck size={18} /> },
  { to: '/admin/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: <ScrollText size={18} /> },
  { to: '/admin/reports', label: 'Reports', icon: <BarChart3 size={18} /> },
];

export default function AdminLayout() {
  const { logout, email } = useAuth();

  return (
    <div className="flex h-screen">
      <Sidebar
        portalLabel="Admin Portal"
        navItems={navItems}
        onLogout={logout}
        footer={<StaffIdentityFooter email={email ?? 'admin@accommodation.test'} role="ADMIN" />}
      />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <Outlet />
      </main>
    </div>
  );
}
