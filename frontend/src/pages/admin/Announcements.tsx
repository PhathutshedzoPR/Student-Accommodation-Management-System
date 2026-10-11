import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import { listAnnouncements, createAnnouncement, deleteAnnouncement } from '@/services/announcements.service';
import { apiErrorMessage } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import { TextField, TextAreaField } from '@/components/Field';
import { formatDateTime } from '@/utils/format';

export default function Announcements() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['announcements'], queryFn: listAnnouncements });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => createAnnouncement(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setOpen(false);
      setForm({ title: '', body: '' });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Posted to every resident's dashboard."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> New announcement
          </button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !data?.length ? (
        <div className="card p-8 text-center text-sm text-gray-400">
          <Megaphone className="mx-auto mb-2 text-gray-300" size={28} />
          No announcements posted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <div key={a.id} className="card flex items-start justify-between p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                <p className="mt-1 text-sm text-gray-600">{a.body}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {a.creator?.email} · {formatDateTime(a.createdAt)}
                </p>
              </div>
              <button className="text-gray-300 hover:text-red-500" onClick={() => deleteMutation.mutate(a.id)} aria-label="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New announcement"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={createMutation.isPending || !form.title || !form.body} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? 'Posting…' : 'Post announcement'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextAreaField label="Message" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
