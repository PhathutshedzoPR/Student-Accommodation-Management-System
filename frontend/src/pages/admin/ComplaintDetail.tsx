import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react';
import { getComplaint, updateComplaint } from '@/services/complaints.service';
import { listStaff } from '@/services/users.service';
import { apiErrorMessage } from '@/services/api';
import { StatusBadge } from '@/components/Badge';
import { SelectField } from '@/components/Field';
import Alert from '@/components/Alert';
import { formatDateTime, titleCase } from '@/utils/format';

const STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function AdminComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['admin', 'complaint', id],
    queryFn: () => getComplaint(id as string),
    enabled: !!id,
  });
  const { data: staff } = useQuery({ queryKey: ['admin', 'staff'], queryFn: listStaff });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'complaint', id] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'complaints'] });
  }

  const update = useMutation({
    mutationFn: (payload: Parameters<typeof updateComplaint>[1]) => updateComplaint(id as string, payload),
    onSuccess: invalidate,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const addNote = useMutation({
    mutationFn: () => updateComplaint(id as string, { note, photo }),
    onSuccess: () => {
      invalidate();
      setNote('');
      setPhoto(null);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (isLoading || !complaint) return <p className="text-sm text-gray-400">Loading…</p>;

  const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ?? 'http://localhost:3001';

  return (
    <div>
      <Link to="/admin/complaints" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Back to complaints
      </Link>

      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs text-gray-400">{complaint.id}</p>
              <h1 className="mt-1 text-lg font-semibold text-gray-900">{complaint.title}</h1>
              <p className="text-sm text-gray-500">
                {complaint.resident?.firstName} {complaint.resident?.lastName} · {complaint.resident?.studentNumber}
              </p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-400">Category: {titleCase(complaint.category)} · Logged {formatDateTime(complaint.createdAt)}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{complaint.description}</p>

          {complaint.photoUrl && (
            <img src={`${apiOrigin}${complaint.photoUrl}`} alt="Evidence" className="mt-4 max-h-64 rounded-lg border border-gray-200" />
          )}

          <div className="mt-6 border-t border-gray-100 pt-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Internal notes</h2>
            <ul className="mb-4 space-y-3">
              {complaint.notes.length === 0 ? (
                <p className="text-sm text-gray-400">No internal notes yet.</p>
              ) : (
                complaint.notes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                    <p className="text-gray-700">{n.note}</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {n.author.email} · {formatDateTime(n.createdAt)}
                    </p>
                  </li>
                ))
              )}
            </ul>
            <div className="flex gap-2">
              <input className="input" placeholder="Add an internal note…" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn-secondary shrink-0" disabled={!note || addNote.isPending} onClick={() => addNote.mutate()}>
                <Send size={15} />
              </button>
            </div>
            <div className="mt-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="text-xs text-gray-500"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
              <span className="ml-2 text-xs text-gray-400">Attach evidence photo (optional, uploads with your next note)</span>
            </div>
          </div>
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Manage ticket</h2>
          <div className="space-y-3">
            <SelectField label="Status" value={complaint.status} onChange={(e) => update.mutate({ status: e.target.value })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </SelectField>
            <SelectField label="Priority" value={complaint.priority} onChange={(e) => update.mutate({ priority: e.target.value })}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {titleCase(p)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Assigned staff member"
              value={complaint.assignedTo ?? ''}
              onChange={(e) => update.mutate({ assignedTo: e.target.value || null })}
            >
              <option value="">Unassigned</option>
              {staff?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.email} ({titleCase(s.role)})
                </option>
              ))}
            </SelectField>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            The resident is notified automatically whenever the status changes.
          </p>
        </div>
      </div>
    </div>
  );
}
