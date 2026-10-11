import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldCheck, LogIn } from 'lucide-react';
import { listVisitors, checkInVisitor } from '@/services/visitors.service';
import { apiErrorMessage } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/Badge';
import Alert from '@/components/Alert';
import { formatDate } from '@/utils/format';
import type { Visitor } from '@/types';

// Check-in flow per the build guide:
// 1. Search by visitor name or VIS-NNNNNN
// 2. Show the visitor card with expected time, resident, room, ID on file
// 3. Security physically verifies the ID against id_number on record
// 4. Tick "ID verified" and click CHECK IN
export default function CheckIn() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Visitor | null>(null);
  const [idVerified, setIdVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: results } = useQuery({
    queryKey: ['security', 'search', q],
    queryFn: () => listVisitors({ status: 'AWAITING_CHECKIN', q: q || undefined }),
    enabled: q.length > 0,
  });

  const checkIn = useMutation({
    mutationFn: () => checkInVisitor(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security'] });
      setSelected(null);
      setIdVerified(false);
      setQ('');
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader title="Check In" subtitle="Search by visitor name or VIS number, verify ID, then check in." />

      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-2.5 text-gray-400" />
            <input
              autoFocus
              className="input pl-8"
              placeholder="Visitor name or VIS-000123…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSelected(null);
                setIdVerified(false);
              }}
            />
          </div>
          <div className="mt-3 max-h-96 space-y-1 overflow-y-auto">
            {results?.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setSelected(v);
                  setIdVerified(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${selected?.id === v.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}
              >
                <p className="font-medium">{v.visitorName}</p>
                <p className="font-mono text-xs text-gray-400">{v.id}</p>
              </button>
            ))}
            {q && results?.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">No awaiting check-in visitors match.</p>}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <div className="card flex h-full flex-col items-center justify-center p-10 text-center text-sm text-gray-400">
              Search and select a visitor to begin check-in.
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
                  <dt className="text-gray-400">Room</dt>
                  <dd className="font-medium text-gray-900">
                    {selected.resident?.bed ? `${selected.resident.bed.room?.roomNumber}${selected.resident.bed.label}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Expected</dt>
                  <dd className="font-medium text-gray-900">
                    {formatDate(selected.expectedDate)} · {selected.expectedFrom}–{selected.expectedUntil}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Purpose</dt>
                  <dd className="font-medium text-gray-900">{selected.purpose}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-400">ID / passport on file</dt>
                  <dd className="font-mono font-medium text-gray-900">{selected.idNumber}</dd>
                </div>
              </dl>

              <label className="mt-5 flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm">
                <input type="checkbox" checked={idVerified} onChange={(e) => setIdVerified(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <ShieldCheck size={16} className="text-gray-400" />
                I have physically verified this visitor's ID matches the number on record
              </label>

              <button className="btn-primary mt-4 w-full" disabled={!idVerified || checkIn.isPending} onClick={() => checkIn.mutate()}>
                <LogIn size={16} /> {checkIn.isPending ? 'Checking in…' : 'Check in'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
