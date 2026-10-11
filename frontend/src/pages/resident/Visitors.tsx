import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, User } from 'lucide-react';
import { listVisitors, inviteVisitor } from '@/services/visitors.service';
import { apiErrorMessage } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/Badge';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import { TextField, TextAreaField } from '@/components/Field';
import { formatDate } from '@/utils/format';

const emptyForm = { visitorName: '', phone: '', idNumber: '', expectedDate: '', expectedFrom: '', expectedUntil: '', purpose: '' };

export default function Visitors() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['visitors', 'me'], queryFn: () => listVisitors() });

  const mutation = useMutation({
    mutationFn: () => inviteVisitor(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors', 'me'] });
      setOpen(false);
      setForm(emptyForm);
      setError(null);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not invite this visitor')),
  });

  return (
    <div>
      <PageHeader
        title="Visitors"
        subtitle="Invite guests in advance. Security verifies their ID and logs the actual check-in / check-out time."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Invite visitor
          </button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !data?.length ? (
        <div className="card p-8 text-center text-sm text-gray-400">No visitors invited yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((v) => (
            <div key={v.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{v.visitorName}</p>
                    <p className="font-mono text-[11px] text-gray-400">{v.id}</p>
                  </div>
                </div>
                <StatusBadge status={v.status} />
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <p>
                  Expected: {formatDate(v.expectedDate)} — {v.expectedFrom} to {v.expectedUntil}
                </p>
                <p>Purpose: {v.purpose}</p>
                {v.checkedInAt && <p className="text-green-600">Checked in: {formatDate(v.checkedInAt)}</p>}
                {v.checkedOutAt && <p className="text-gray-500">Checked out: {formatDate(v.checkedOutAt)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite a visitor"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={mutation.isPending || !form.visitorName || !form.phone || !form.idNumber || !form.expectedDate}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Saving…' : 'Invite'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <Alert tone="info">
            Security will verify this ID/passport number in person before letting your visitor in, and will log the
            exact time they arrive and leave against your name.
          </Alert>
          <TextField label="Visitor full name" value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} />
          <TextField label="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="ID or passport number" value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <TextField label="Date" type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} />
            <TextField label="From" type="time" value={form.expectedFrom} onChange={(e) => setForm({ ...form, expectedFrom: e.target.value })} />
            <TextField label="Until" type="time" value={form.expectedUntil} onChange={(e) => setForm({ ...form, expectedUntil: e.target.value })} />
          </div>
          <TextAreaField label="Purpose of visit" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
