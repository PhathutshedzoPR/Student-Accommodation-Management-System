import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { listVisitors } from '@/services/visitors.service';
import PageHeader from '@/components/PageHeader';
import DataTable, { type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/Badge';
import { formatDate } from '@/utils/format';
import type { Visitor } from '@/types';

const STATUSES = ['', 'AWAITING_CHECKIN', 'CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW'];

export default function AdminVisitors() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'visitors', status, q],
    queryFn: () => listVisitors({ status: status || undefined, q: q || undefined }),
  });

  const columns: Column<Visitor>[] = [
    { header: 'Visitor', cell: (v) => `${v.visitorName} (${v.id})` },
    { header: 'Invited by', cell: (v) => `${v.resident?.firstName} ${v.resident?.lastName}` },
    {
      header: 'Room',
      cell: (v) => (v.resident?.bed ? `${v.resident.bed.room?.roomNumber}${v.resident.bed.label}` : '—'),
    },
    { header: 'Expected', cell: (v) => `${formatDate(v.expectedDate)} ${v.expectedFrom}` },
    { header: 'Status', cell: (v) => <StatusBadge status={v.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Visitors"
        subtitle="Every visitor invited across the property — security logs the actual check-in / check-out."
        actions={
          <div className="flex gap-2">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input w-56 pl-8" placeholder="Search visitor or resident…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="input w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s ? s.replace('_', ' ') : 'All statuses'}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <DataTable columns={columns} rows={data ?? []} rowKey={(v) => v.id} isLoading={isLoading} emptyMessage="No visitors found." />
    </div>
  );
}
