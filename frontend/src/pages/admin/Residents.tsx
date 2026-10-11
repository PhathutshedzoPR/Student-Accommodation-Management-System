import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { listResidents } from '@/services/residents.service';
import PageHeader from '@/components/PageHeader';
import DataTable, { type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import type { Resident } from '@/types';

export default function Residents() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'residents', q], queryFn: () => listResidents({ q: q || undefined }) });

  const columns: Column<Resident>[] = [
    { header: 'Name', cell: (r) => `${r.firstName} ${r.lastName}` },
    { header: 'Student number', cell: (r) => r.studentNumber },
    { header: 'Course', cell: (r) => r.course },
    { header: 'Email', cell: (r) => r.user?.email },
    {
      header: 'Room',
      cell: (r) =>
        r.bed ? (
          <Badge tone="green">
            {r.bed.room?.building?.name} {r.bed.room?.roomNumber}
            {r.bed.label}
          </Badge>
        ) : (
          <Badge tone="gray">Unassigned</Badge>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Residents"
        subtitle="Everyone currently registered in the system."
        actions={
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-2.5 text-gray-400" />
            <input className="input w-64 pl-8" placeholder="Search name or student number…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        }
      />
      <DataTable
        columns={columns}
        rows={data ?? []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        onRowClick={(r) => navigate(`/admin/residents/${r.id}`)}
        emptyMessage="No residents found."
      />
    </div>
  );
}
