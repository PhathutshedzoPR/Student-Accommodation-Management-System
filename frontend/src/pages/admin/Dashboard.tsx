import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BedDouble, FileText, Wrench, Users2, Banknote, AlertCircle } from 'lucide-react';
import { getAdminDashboard } from '@/services/reports.service';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { formatCurrency } from '@/utils/format';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getAdminDashboard });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Occupancy, applications, complaints and revenue at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Occupancy"
          value={isLoading ? '—' : `${data?.occupancyRate}%`}
          sub={data ? `${data.occupiedBeds} / ${data.totalBeds} beds` : undefined}
          icon={<BedDouble size={20} />}
        />
        <StatCard
          label="Pending Applications"
          value={data?.pendingApplications ?? '—'}
          icon={<FileText size={20} />}
          tone={data?.pendingApplications ? 'warning' : 'default'}
        />
        <StatCard label="Open Complaints" value={data?.openComplaints ?? '—'} icon={<Wrench size={20} />} tone={data?.openComplaints ? 'warning' : 'default'} />
        <StatCard label="Visitors Today" value={data?.visitorsToday ?? '—'} icon={<Users2 size={20} />} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Revenue collected" value={isLoading ? '—' : formatCurrency(data?.totalRevenue ?? 0)} icon={<Banknote size={20} />} tone="success" />
        <StatCard
          label="Outstanding balance"
          value={isLoading ? '—' : formatCurrency(data?.totalOutstanding ?? 0)}
          icon={<AlertCircle size={20} />}
          tone={data && data.totalOutstanding > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="card mt-6 p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Quick links</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link to="/admin/applications" className="btn-secondary justify-start">Review applications</Link>
          <Link to="/admin/complaints" className="btn-secondary justify-start">Manage complaints</Link>
          <Link to="/admin/rooms" className="btn-secondary justify-start">Assign rooms</Link>
          <Link to="/admin/announcements" className="btn-secondary justify-start">Post an announcement</Link>
        </div>
      </div>
    </div>
  );
}
