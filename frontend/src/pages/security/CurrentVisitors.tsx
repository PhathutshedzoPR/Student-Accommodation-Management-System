import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { listVisitors } from '@/services/visitors.service';
import PageHeader from '@/components/PageHeader';
import DataTable, { type Column } from '@/components/DataTable';
import { formatDateTime } from '@/utils/format';
import type { Visitor } from '@/types';

// Only CHECKED_IN visitors — useful at a glance for emergency evacuations
// and end-of-night checks, per the build guide.
export default function CurrentVisitors() {
  const { data, isLoading } = useQuery({ queryKey: ['security', 'current'], queryFn: () => listVisitors({ status: 'CHECKED_IN' }) });

  const columns: Column<Visitor>[] = [
    { header: 'Visitor', cell: (v) => v.visitorName },
    { header: 'Invited by', cell: (v) => `${v.resident?.firstName} ${v.resident?.lastName}` },
    { header: 'Room', cell: (v) => (v.resident?.bed ? `${v.resident.bed.room?.roomNumber}${v.resident.bed.label}` : '—') },
    { header: 'Checked in at', cell: (v) => formatDateTime(v.checkedInAt) },
  ];

  return (
    <div>
      <PageHeader title="Current Visitors" subtitle="Everyone inside the building right now." actions={<span className="text-sm text-gray-500 flex items-center gap-1"><Users size={16}/> {data?.length ?? 0} inside</span>} />
      <DataTable columns={columns} rows={data ?? []} rowKey={(v) => v.id} isLoading={isLoading} emptyMessage="No one is currently checked in." />
    </div>
  );
}
