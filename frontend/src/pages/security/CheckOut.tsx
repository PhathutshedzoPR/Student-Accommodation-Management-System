import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, LogOut } from 'lucide-react';
import { listVisitors, checkOutVisitor } from '@/services/visitors.service';
import { apiErrorMessage } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/Badge';
import Alert from '@/components/Alert';
import { formatDateTime } from '@/utils/format';
import type { Visitor } from '@/types';

export default function CheckOut() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Visitor | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: results } = useQuery({
    queryKey: ['security', 'checked-in', q],
    queryFn: () => listVisitors({ status: 'CHECKED_IN', q: q || undefined }),
  });

  const checkOut = useMutation({
    mutationFn: () => checkOutVisitor(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security'] });
      setSelected(null);
      setQ('');
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader title="Check Out" subtitle="Search for a currently checked-in visitor and check them out." />

      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-2.5 text-gray-400" />
            <input autoFocus className="input pl-8" placeholder="Visitor name or VIS-000123…" value={q} onChange={(e) => (setQ(e.target.value), setSelected(null))} />
          </div>
          <div className="mt-3 max-h-96 space-y-1 overflow-y-auto">
            {results?.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelected(v)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${selected?.id === v.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}
              >
                <p className="font-medium">{v.visitorName}</p>
                <p className="font-mono text-xs text-gray-400">{v.id}</p>
              </button>
            ))}
            {results?.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">No one currently checked in matches.</p>}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <div className="card flex h-full flex-col items-center justify-center p-10 text-center text-sm text-gray-400">
              Select a checked-in visitor to check them out.
            </div>
          ) : (
            <div className="card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selected.visitorName}</h2>
                  <p className="font-mono text-xs text-gray-400">{selected.id}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-400">Invited by</dt>
                  <dd className="font-medium text-gray-900">
                    {selected.resident?.firstName} {selected.resident?.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Checked in at</dt>
                  <dd className="font-medium text-gray-900">{formatDateTime(selected.checkedInAt)}</dd>
                </div>
              </dl>
              <button className="btn-primary mt-5 w-full" disabled={checkOut.isPending} onClick={() => checkOut.mutate()}>
                <LogOut size={16} /> {checkOut.isPending ? 'Checking out…' : 'Check out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
