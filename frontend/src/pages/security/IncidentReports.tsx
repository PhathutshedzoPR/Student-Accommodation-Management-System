import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldAlert } from 'lucide-react';
import { listIncidents, createIncident, listVisitors } from '@/services/visitors.service';
import { listResidents } from '@/services/residents.service';
import { apiErrorMessage } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import { TextAreaField, SelectField } from '@/components/Field';
import { formatDateTime } from '@/utils/format';

export default function IncidentReports() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ visitorId: '', residentId: '', description: '', peopleInvolved: '' });
  const [error, setError] = useState<string | null>(null);

  const { data: incidents, isLoading } = useQuery({ queryKey: ['incidents'], queryFn: listIncidents });
  const { data: visitors } = useQuery({ queryKey: ['visitors', 'all-for-incident'], queryFn: () => listVisitors(), enabled: open });
  const { data: residents } = useQuery({ queryKey: ['residents', 'all-for-incident'], queryFn: () => listResidents(), enabled: open });

  const mutation = useMutation({
    mutationFn: () =>
      createIncident({
        visitorId: form.visitorId || undefined,
        residentId: form.residentId || undefined,
        description: form.description,
        peopleInvolved: form.peopleInvolved || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setOpen(false);
      setForm({ visitorId: '', residentId: '', description: '', peopleInvolved: '' });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        title="Incident Reports"
        subtitle="Kept separate from the audit trail so investigation notes never contaminate it."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> New incident report
          </button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !incidents?.length ? (
        <div className="card p-8 text-center text-sm text-gray-400">
          <ShieldAlert className="mx-auto mb-2 text-gray-300" size={28} />
          No incidents reported.
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="text-sm text-gray-500">
                  {inc.visitor && (
                    <span className="font-medium text-gray-900">
                      Visitor: {inc.visitor.visitorName} ({inc.visitor.id})
                    </span>
                  )}
                  {inc.resident && (
                    <span className="ml-2">
                      Host: {inc.resident.firstName} {inc.resident.lastName}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{formatDateTime(inc.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{inc.description}</p>
              {inc.peopleInvolved && <p className="mt-1 text-xs text-gray-400">People involved: {inc.peopleInvolved}</p>}
              <p className="mt-2 text-xs text-gray-400">Reported by {inc.creator.email}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New incident report"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={mutation.isPending || !form.description} onClick={() => mutation.mutate()}>
              {mutation.isPending ? 'Saving…' : 'Save report'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <SelectField label="Related visitor (optional)" value={form.visitorId} onChange={(e) => setForm({ ...form, visitorId: e.target.value })}>
            <option value="">None</option>
            {visitors?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.visitorName} ({v.id})
              </option>
            ))}
          </SelectField>
          <SelectField label="Related resident / host (optional)" value={form.residentId} onChange={(e) => setForm({ ...form, residentId: e.target.value })}>
            <option value="">None</option>
            {residents?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.firstName} {r.lastName} — {r.studentNumber}
              </option>
            ))}
          </SelectField>
          <TextAreaField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happened, when, and where…" />
          <TextAreaField label="People involved (optional)" value={form.peopleInvolved} onChange={(e) => setForm({ ...form, peopleInvolved: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
