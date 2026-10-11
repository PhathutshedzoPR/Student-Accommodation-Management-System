import { useQuery } from '@tanstack/react-query';
import { BedDouble } from 'lucide-react';
import { getMyAccommodation } from '@/services/residents.service';
import PageHeader from '@/components/PageHeader';
import { formatDate } from '@/utils/format';

export default function MyRoom() {
  const { data, isLoading } = useQuery({ queryKey: ['resident', 'accommodation'], queryFn: getMyAccommodation });

  return (
    <div>
      <PageHeader title="My Room" />

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !data?.assigned ? (
        <div className="card p-8 text-center">
          <BedDouble className="mx-auto mb-3 text-gray-300" size={32} />
          <p className="text-sm text-gray-500">No room assigned yet — check your application status for progress.</p>
        </div>
      ) : (
        <div className="card max-w-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <BedDouble size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {data.building} — Room {data.roomNumber}
                {data.bedLabel}
              </p>
              <p className="text-sm text-gray-500">Floor {data.floor}</p>
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            <Row label="Building" value={data.building} />
            <Row label="Room" value={data.roomNumber} />
            <Row label="Bed" value={data.bedLabel} />
            <Row label="Floor" value={String(data.floor)} />
            <Row label="Move-in date" value={formatDate(data.moveInDate)} />
          </dl>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-1.5 last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
