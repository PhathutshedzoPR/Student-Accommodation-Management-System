import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { listComplaints, createComplaint } from '@/services/complaints.service';
import { apiErrorMessage } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import DataTable, { type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/Badge';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import { TextField, TextAreaField, SelectField } from '@/components/Field';
import { formatDate, titleCase } from '@/utils/format';
import type { Complaint } from '@/types';

const CATEGORIES = ['PLUMBING', 'ELECTRICAL', 'LIFT', 'INTERNET', 'CLEANING', 'SECURITY', 'FURNITURE', 'NOISE', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function Complaints() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'PLUMBING', title: '', description: '', priority: 'MEDIUM' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['complaints', 'me'], queryFn: () => listComplaints() });

  const mutation = useMutation({
    mutationFn: () => createComplaint({ ...form, photo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints', 'me'] });
      setOpen(false);
      setForm({ category: 'PLUMBING', title: '', description: '', priority: 'MEDIUM' });
      setPhoto(null);
      setError(null);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not submit your complaint')),
  });

  const columns: Column<Complaint>[] = [
    { header: 'Ticket', cell: (c) => <span className="font-mono text-xs text-gray-500">{c.id}</span> },
    { header: 'Title', cell: (c) => c.title },
    { header: 'Category', cell: (c) => titleCase(c.category) },
    { header: 'Priority', cell: (c) => <StatusBadge status={c.priority} /> },
    { header: 'Status', cell: (c) => <StatusBadge status={c.status} /> },
    { header: 'Logged', cell: (c) => formatDate(c.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Complaints"
        subtitle="Log maintenance issues like a broken toilet or a lift that's out of order."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> New complaint
          </button>
        }
      />

      <DataTable
        columns={columns}
        rows={data ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        onRowClick={(c) => navigate(`/resident/complaints/${c.id}`)}
        emptyMessage="You haven't logged any complaints yet."
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Log a complaint"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={mutation.isPending || !form.title || !form.description} onClick={() => mutation.mutate()}>
              {mutation.isPending ? 'Submitting…' : 'Submit'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <SelectField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {titleCase(c)}
              </option>
            ))}
          </SelectField>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Toilet not flushing" />
          <TextAreaField
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the issue in detail — what's wrong, since when, and anything you've already tried."
          />
          <SelectField label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {titleCase(p)}
              </option>
            ))}
          </SelectField>
          <div>
            <label className="label">Photo (optional, JPEG/PNG, max 5MB)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="input cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
