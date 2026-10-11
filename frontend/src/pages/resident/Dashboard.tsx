import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BedDouble, Wallet, Wrench, Users, Megaphone } from 'lucide-react';
import { getResidentDashboard } from '@/services/reports.service';
import { listAnnouncements } from '@/services/announcements.service';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { formatCurrency, formatDateTime } from '@/utils/format';

export default function ResidentDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['resident', 'dashboard'], queryFn: getResidentDashboard });
  const { data: announcements } = useQuery({ queryKey: ['announcements'], queryFn: listAnnouncements });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="A quick look at your room, balance, and activity." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My Room"
          value={data?.room ? `${data.room.building} — ${data.room.roomNumber}${data.room.bedLabel}` : 'Not assigned'}
          sub={data?.room ? undefined : 'Track your application status'}
          icon={<BedDouble size={20} />}
        />
        <StatCard
          label="Amount Due"
          value={isLoading ? '—' : formatCurrency(data?.balance ?? 0)}
          icon={<Wallet size={20} />}
          tone={data && data.balance > 0 ? 'warning' : 'success'}
        />
        <StatCard label="Open Complaints" value={data?.openComplaints ?? '—'} icon={<Wrench size={20} />} tone={data?.openComplaints ? 'warning' : 'default'} />
        <StatCard label="Visitors Today" value={data?.visitorsToday ?? '—'} icon={<Users size={20} />} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Quick links</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/resident/complaints" className="btn-secondary justify-start">Log a complaint</Link>
            <Link to="/resident/visitors" className="btn-secondary justify-start">Invite a visitor</Link>
            <Link to="/resident/account" className="btn-secondary justify-start">View balance</Link>
            <Link to="/resident/application" className="btn-secondary justify-start">Application status</Link>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Megaphone size={16} /> Announcements
          </h2>
          {!announcements?.length ? (
            <p className="text-sm text-gray-400">No announcements right now.</p>
          ) : (
            <ul className="space-y-3">
              {announcements.slice(0, 4).map((a) => (
                <li key={a.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{a.body}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{formatDateTime(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
