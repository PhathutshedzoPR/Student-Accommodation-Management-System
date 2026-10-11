import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listVisitors, checkInVisitor, checkOutVisitor } from '@/services/visitors.service';
import { apiErrorMessage } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/Badge';
import { useState } from 'react';
import Alert from '@/components/Alert';

export default function TodayVisitors() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['security', 'today'], queryFn: () => listVisitors({ date: 'today' }) });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['security'] });
  }

  const checkIn = useMutation({
    mutationFn: (id: string) => checkInVisitor(id),
    onSuccess: invalidate,
    onError: (err) => setError(apiErrorMessage(err)),
  });
  const checkOut = useMutation({
    mutationFn: (id: string) => checkOutVisitor(id),
    onSuccess: invalidate,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader title="Today's Visitors" subtitle="Everyone expected at the gate today." />

      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !data?.length ? (
        <div className="card p-8 text-center text-sm text-gray-400">No visitors expected today.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((v) => (
            <div key={v.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{v.visitorName}</p>
                  <p className="font-mono text-[11px] text-gray-400">{v.id}</p>
                </div>
                <StatusBadge status={v.status} />
              </div>
              <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                <p>
                  Invited by {v.resident?.firstName} {v.resident?.lastName}
                  {v.resident?.bed ? ` — ${v.resident.bed.room?.roomNumber}${v.resident.bed.label}` : ''}
                </p>
                <p>
                  {v.expectedFrom} – {v.expectedUntil} · {v.purpose}
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                {v.status === 'AWAITING_CHECKIN' && (
                  <button className="btn-primary flex-1 text-xs" disabled={checkIn.isPending} onClick={() => checkIn.mutate(v.id)}>
                    Check in
                  </button>
                )}
                {v.status === 'CHECKED_IN' && (
                  <button className="btn-secondary flex-1 text-xs" disabled={checkOut.isPending} onClick={() => checkOut.mutate(v.id)}>
                    Check out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
