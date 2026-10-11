import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, FileText, BedDouble, Wallet, Receipt, Wrench, Users, Bell, UserCircle } from 'lucide-react';
import Sidebar, { type NavItem } from '@/components/Sidebar';
import { ResidentIdentityFooter } from '@/components/IdentityFooter';
import { useAuth } from '@/context/AuthContext';
import { getMe } from '@/services/residents.service';

const navItems: NavItem[] = [
  { to: '/resident/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/resident/application', label: 'My Application', icon: <FileText size={18} /> },
  { to: '/resident/room', label: 'My Room', icon: <BedDouble size={18} /> },
  { to: '/resident/account', label: 'My Account', icon: <Wallet size={18} /> },
  { to: '/resident/payments', label: 'Payments', icon: <Receipt size={18} /> },
  { to: '/resident/complaints', label: 'Complaints', icon: <Wrench size={18} /> },
  { to: '/resident/visitors', label: 'Visitors', icon: <Users size={18} /> },
  { to: '/resident/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/resident/profile', label: 'Profile', icon: <UserCircle size={18} /> },
];

export default function ResidentLayout() {
  const { logout } = useAuth();
  // Fetched once here (per the build guide) so the identity strip at the
  // bottom of the sidebar is available on every resident page.
  const { data: resident } = useQuery({ queryKey: ['resident', 'me'], queryFn: getMe });

  return (
    <div className="flex h-screen">
      <Sidebar
        portalLabel="Resident Portal"
        navItems={navItems}
        onLogout={logout}
        footer={
          resident ? (
            <ResidentIdentityFooter
              firstName={resident.firstName}
              lastName={resident.lastName}
              course={resident.course}
              school={resident.school}
            />
          ) : (
            <div className="h-9 animate-pulse rounded bg-gray-100" />
          )
        }
      />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <Outlet />
      </main>
    </div>
  );
}
