import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import { getResident } from '@/services/residents.service';
import { getResidentBalance, addCharge, addPayment } from '@/services/payments.service';
import { apiErrorMessage } from '@/services/api';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import { TextField, SelectField } from '@/components/Field';
import { formatCurrency, formatDate, initials, titleCase } from '@/utils/format';

export default function ResidentDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [chargeOpen, setChargeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState({ type: 'ACCOMMODATION', amount: '', period: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  const { data: resident } = useQuery({ queryKey: ['admin', 'resident', id], queryFn: () => getResident(id as string), enabled: !!id });
  const { data: balance } = useQuery({ queryKey: ['admin', 'resident', id, 'balance'], queryFn: () => getResidentBalance(id as string), enabled: !!id });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'resident', id, 'balance'] });
  }

  const chargeMutation = useMutation({
    mutationFn: () => addCharge({ residentId: id as string, type: chargeForm.type, amount: Number(chargeForm.amount), period: chargeForm.period }),
    onSuccess: () => {
      invalidate();
      setChargeOpen(false);
      setChargeForm({ type: 'ACCOMMODATION', amount: '', period: '' });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const paymentMutation = useMutation({
    mutationFn: () => addPayment({ residentId: id as string, amount: Number(paymentForm.amount), description: paymentForm.description }),
    onSuccess: () => {
      invalidate();
      setPaymentOpen(false);
      setPaymentForm({ amount: '', description: '' });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (!resident) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div>
      <Link to="/admin/residents" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Back to residents
      </Link>

      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
            {initials(resident.firstName, resident.lastName)}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {resident.firstName} {resident.lastName}
            </h1>
            <p className="text-sm text-gray-500">
              {resident.studentNumber} · {resident.user?.email}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-gray-400">Phone</dt>
            <dd className="font-medium text-gray-900">{resident.phone}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Course</dt>
            <dd className="font-medium text-gray-900">{resident.course}</dd>
          </div>
          <div>
            <dt className="text-gray-400">School</dt>
            <dd className="font-medium text-gray-900">{resident.school}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Room</dt>
            <dd className="font-medium text-gray-900">
              {resident.bed ? `${resident.bed.room?.building?.name} ${resident.bed.room?.roomNumber}${resident.bed.label}` : 'Unassigned'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current balance</p>
            <p className="text-2xl font-semibold text-gray-900">{balance ? formatCurrency(balance.balance) : '—'}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setChargeOpen(true)}>
              <Plus size={16} /> Add charge
            </button>
            <button className="btn-primary" onClick={() => setPaymentOpen(true)}>
              <Plus size={16} /> Record payment
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Charges</h2>
            <ul className="divide-y divide-gray-100 text-sm">
              {balance?.charges.length ? (
                balance.charges.map((c) => (
                  <li key={c.id} className="flex justify-between py-1.5">
                    <span className="text-gray-600">
                      {titleCase(c.type)} — {c.period}
                    </span>
                    <span className="font-medium text-gray-900">{formatCurrency(c.amount)}</span>
                  </li>
                ))
              ) : (
                <p className="text-gray-400">No charges yet.</p>
              )}
            </ul>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Payments</h2>
            <ul className="divide-y divide-gray-100 text-sm">
              {balance?.payments.length ? (
                balance.payments.map((p) => (
                  <li key={p.id} className="flex justify-between py-1.5">
                    <span className="text-gray-600">
                      {p.description} — {formatDate(p.paidAt)}
                    </span>
                    <span className="font-medium text-gray-900">{formatCurrency(p.amount)}</span>
                  </li>
                ))
              ) : (
                <p className="text-gray-400">No payments yet.</p>
              )}
            </ul>
          </div>
        </div>
      </div>

      <Modal
        open={chargeOpen}
        onClose={() => setChargeOpen(false)}
        title="Add a charge"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setChargeOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={chargeMutation.isPending || !chargeForm.amount || !chargeForm.period} onClick={() => chargeMutation.mutate()}>
              {chargeMutation.isPending ? 'Adding…' : 'Add charge'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectField label="Type" value={chargeForm.type} onChange={(e) => setChargeForm({ ...chargeForm, type: e.target.value })}>
            <option value="ACCOMMODATION">Accommodation</option>
            <option value="ELECTRICITY">Electricity</option>
            <option value="LAUNDRY">Laundry</option>
            <option value="OTHER">Other</option>
          </SelectField>
          <TextField label="Amount (R)" type="number" min="0" step="0.01" value={chargeForm.amount} onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })} />
          <TextField label="Period" placeholder="YYYY-MM, e.g. 2027-03" value={chargeForm.period} onChange={(e) => setChargeForm({ ...chargeForm, period: e.target.value })} />
        </div>
      </Modal>

      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record a payment"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPaymentOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={paymentMutation.isPending || !paymentForm.amount || !paymentForm.description} onClick={() => paymentMutation.mutate()}>
              {paymentMutation.isPending ? 'Saving…' : 'Record payment'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Amount (R)" type="number" min="0" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
          <TextField label="Description" placeholder="e.g. Accommodation — March" value={paymentForm.description} onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
