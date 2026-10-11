import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '@/services/users.service';
import PageHeader from '@/components/PageHeader';
import DataTable, { type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { formatDateTime, titleCase } from '@/utils/format';
import type { AuditLog } from '@/types';

export default function AuditLogs() {
  const [targetType, setTargetType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', targetType, page],
    queryFn: () => listAuditLogs({ targetType: targetType || undefined, page }),
  });

  const columns: Column<AuditLog>[] = [
    { header: 'When', cell: (l) => formatDateTime(l.createdAt) },
    { header: 'Action', cell: (l) => <Badge tone="blue">{l.action.replace(/_/g, ' ')}</Badge> },
    { header: 'Target', cell: (l) => `${titleCase(l.targetType)}${l.targetId ? ` · ${l.targetId.slice(0, 8)}` : ''}` },
    { header: 'By', cell: (l) => l.user?.email ?? 'System' },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Append-only trail of every sensitive action — bed assignments, visitor check-ins, payments, and more."
        actions={
          <select className="input w-44" value={targetType} onChange={(e) => (setTargetType(e.target.value), setPage(1))}>
            <option value="">All targets</option>
            <option value="resident">Resident</option>
            <option value="application">Application</option>
            <option value="complaint">Complaint</option>
            <option value="visitor">Visitor</option>
          </select>
        }
      />

      <DataTable columns={columns} rows={data?.items ?? []} rowKey={(l) => l.id} isLoading={isLoading} emptyMessage="No audit entries match this filter." />

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
