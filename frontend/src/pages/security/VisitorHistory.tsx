import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { visitorHistory } from '@/services/visitors.service';
import PageHeader from '@/components/PageHeader';
import DataTable, { type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/Badge';
import { formatDate, formatDateTime } from '@/utils/format';
import type { Visitor } from '@/types';

export default function VisitorHistory() {
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['security', 'history', q, dateFrom, dateTo],
    queryFn: () => visitorHistory({ q: q || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
  });

  const columns: Column<Visitor>[] = [
    { header: 'Visitor', cell: (v) => `${v.visitorName} (${v.id})` },
    { header: 'ID number', cell: (v) => <span className="font-mono text-xs">{v.idNumber}</span> },
    { header: 'Invited by', cell: (v) => `${v.resident?.firstName} ${v.resident?.lastName}` },
    { header: 'Expected', cell: (v) => formatDate(v.expectedDate) },
    { header: 'Checked in', cell: (v) => formatDateTime(v.checkedInAt) },
    { header: 'Checked out', cell: (v) => formatDateTime(v.checkedOutAt) },
    { header: 'Status', cell: (v) => <StatusBadge status={v.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Visitor History"
        subtitle="Searchable, read-only record of every visit."
        actions={
          <div className="flex gap-2">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input w-56 pl-8" placeholder="Visitor, ID or resident name…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <input className="input w-36" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input className="input w-36" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        }
      />
      <DataTable columns={columns} rows={data ?? []} rowKey={(v) => v.id} isLoading={isLoading} emptyMessage="No visits match this search." />
    </div>
  );
}
