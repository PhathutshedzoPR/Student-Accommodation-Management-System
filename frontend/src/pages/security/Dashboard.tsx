import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarClock, Users, LogIn, ShieldAlert } from 'lucide-react';
import { listVisitors } from '@/services/visitors.service';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import DataTable, { type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/Badge';
import type { Visitor } from '@/types';

export default function SecurityDashboard() {
  const { data: today, isLoading } = useQuery({ queryKey: ['security', 'today'], queryFn: () => listVisitors({ date: 'today' }) });

  const expected = today?.filter((v) => v.status === 'AWAITING_CHECKIN').length ?? 0;
  const checkedIn = today?.filter((v) => v.status === 'CHECKED_IN').length ?? 0;
  const noShow = today?.filter((v) => v.status === 'NO_SHOW').length ?? 0;

  const columns: Column<Visitor>[] = [
    { header: 'Visitor', cell: (v) => v.visitorName },
    { header: 'Invited by', cell: (v) => `${v.resident?.firstName} ${v.resident?.lastName}` },
    { header: 'Room', cell: (v) => (v.resident?.bed ? `${v.resident.bed.room?.roomNumber}${v.resident.bed.label}` : '—') },
    { header: 'Expected', cell: (v) => v.expectedFrom },
    { header: 'Status', cell: (v) => <StatusBadge status={v.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live view of all expected visitors today." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Expected today" value={expected} icon={<CalendarClock size={20} />} />
        <StatCard label="Currently inside" value={checkedIn} icon={<Users size={20} />} tone="success" />
        <StatCard label="No-shows" value={noShow} icon={<ShieldAlert size={20} />} tone={noShow ? 'danger' : 'default'} />
        <div className="card flex flex-col justify-center gap-2 p-5">
          <Link to="/security/check-in" className="btn-primary justify-center">
            <LogIn size={16} /> Check in a visitor
          </Link>
          <Link to="/security/incidents" className="btn-secondary justify-center">
            Report an incident
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Today's visitors</h2>
        <DataTable columns={columns} rows={today ?? []} rowKey={(v) => v.id} isLoading={isLoading} emptyMessage="No visitors expected today." />
      </div>
    </div>
  );
}
