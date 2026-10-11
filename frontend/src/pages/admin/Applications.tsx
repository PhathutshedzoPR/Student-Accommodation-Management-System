import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listApplications } from '@/services/applications.service';
import PageHeader from '@/components/PageHeader';
import DataTable, { type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/Badge';
import { formatDate } from '@/utils/format';
import type { Application } from '@/types';

const STATUSES = ['', 'SUBMITTED', 'DOCUMENTS_VERIFIED', 'APPROVED', 'ROOM_ASSIGNED', 'REJECTED'];

export default function Applications() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'applications', status, page],
    queryFn: () => listApplications({ status: status || undefined, page }),
  });

  const columns: Column<Application>[] = [
    { header: 'Applicant', cell: (a) => `${a.resident?.firstName} ${a.resident?.lastName}` },
    { header: 'Student number', cell: (a) => a.resident?.studentNumber },
    { header: 'Date submitted', cell: (a) => formatDate(a.submittedAt) },
    { header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="Review documents, approve or reject, and assign a bed."
        actions={
          <select className="input w-48" value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s ? s.replace('_', ' ') : 'All statuses'}
              </option>
            ))}
          </select>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        onRowClick={(a) => navigate(`/admin/applications/${a.id}`)}
        emptyMessage="No applications match this filter."
      />

      {data && data.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn-secondary" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
