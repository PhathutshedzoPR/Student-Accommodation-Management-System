import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listComplaints } from '@/services/complaints.service';
import PageHeader from '@/components/PageHeader';
import DataTable, { type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/Badge';
import { formatDate, titleCase } from '@/utils/format';
import type { Complaint } from '@/types';

const STATUSES = ['', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const CATEGORIES = ['', 'PLUMBING', 'ELECTRICAL', 'LIFT', 'INTERNET', 'CLEANING', 'SECURITY', 'FURNITURE', 'NOISE', 'OTHER'];
const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function AdminComplaints() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'complaints', status, category, priority],
    queryFn: () => listComplaints({ status: status || undefined, category: category || undefined, priority: priority || undefined }),
  });

  const columns: Column<Complaint>[] = [
    { header: 'Ticket', cell: (c) => <span className="font-mono text-xs text-gray-500">{c.id}</span> },
    { header: 'Resident', cell: (c) => `${c.resident?.firstName} ${c.resident?.lastName}` },
    { header: 'Title', cell: (c) => c.title },
    { header: 'Category', cell: (c) => titleCase(c.category) },
    { header: 'Priority', cell: (c) => <StatusBadge status={c.priority} /> },
    { header: 'Status', cell: (c) => <StatusBadge status={c.status} /> },
    { header: 'Logged', cell: (c) => formatDate(c.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Complaints"
        subtitle="Help-desk style ticketing for maintenance issues."
        actions={
          <div className="flex gap-2">
            <select className="input w-36" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s ? titleCase(s) : 'All statuses'}
                </option>
              ))}
            </select>
            <select className="input w-36" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c ? titleCase(c) : 'All categories'}
                </option>
              ))}
            </select>
            <select className="input w-32" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p ? titleCase(p) : 'All priorities'}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={data ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        onRowClick={(c) => navigate(`/admin/complaints/${c.id}`)}
        emptyMessage="No complaints match this filter."
      />
    </div>
  );
}
