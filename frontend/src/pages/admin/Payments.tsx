import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Banknote } from 'lucide-react';
import { listResidents } from '@/services/residents.service';
import { getResidentBalance, addCharge, addPayment } from '@/services/payments.service';
import { apiErrorMessage } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import Alert from '@/components/Alert';
import { TextField, SelectField } from '@/components/Field';
import { formatCurrency, formatDate, titleCase } from '@/utils/format';
import type { Resident } from '@/types';

export default function AdminPayments() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Resident | null>(null);

  const { data: residents } = useQuery({
    queryKey: ['admin', 'residents', 'search', search],
    queryFn: () => listResidents({ q: search || undefined }),
    enabled: search.length > 1,
  });

  return (
    <div>
      <PageHeader title="Payments" subtitle="Add a charge or record a payment against any resident's account." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Find a resident</h2>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-2.5 text-gray-400" />
            <input
              className="input pl-8"
              placeholder="Search name or student number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
            {residents?.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${selected?.id === r.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}
              >
                <p className="font-medium">
                  {r.firstName} {r.lastName}
                </p>
                <p className="text-xs text-gray-400">{r.studentNumber}</p>
              </button>
            ))}
            {search.length > 1 && residents?.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">No matches.</p>}
          </div>
        </div>

        <div className="lg:col-span-3">{selected ? <ResidentLedger resident={selected} /> : <EmptyState />}</div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card flex h-full flex-col items-center justify-center p-10 text-center text-sm text-gray-400">
      <Banknote className="mb-2 text-gray-300" size={28} />
      Search for and select a resident to add a charge or record a payment.
    </div>
  );
}

function ResidentLedger({ resident }: { resident: Resident }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'charge' | 'payment'>('charge');
  const [chargeForm, setChargeForm] = useState({ type: 'ACCOMMODATION', amount: '', period: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: balance } = useQuery({
    queryKey: ['admin', 'resident', resident.id, 'balance'],
    queryFn: () => getResidentBalance(resident.id),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'resident', resident.id, 'balance'] });
  }

  const chargeMutation = useMutation({
    mutationFn: () => addCharge({ residentId: resident.id, type: chargeForm.type, amount: Number(chargeForm.amount), period: chargeForm.period }),
    onSuccess: () => {
      invalidate();
      setChargeForm({ type: 'ACCOMMODATION', amount: '', period: '' });
      setSuccess('Charge added.');
      setError(null);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const paymentMutation = useMutation({
    mutationFn: () => addPayment({ residentId: resident.id, amount: Number(paymentForm.amount), description: paymentForm.description }),
    onSuccess: () => {
      invalidate();
      setPaymentForm({ amount: '', description: '' });
      setSuccess('Payment recorded.');
      setError(null);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {resident.firstName} {resident.lastName}
          </p>
          <p className="text-xs text-gray-400">{resident.studentNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Current balance</p>
          <p className="text-lg font-semibold text-gray-900">{balance ? formatCurrency(balance.balance) : '—'}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className={tab === 'charge' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('charge')}>
          Add charge
        </button>
        <button className={tab === 'payment' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('payment')}>
          Record payment
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        {tab === 'charge' ? (
          <>
            <SelectField label="Type" value={chargeForm.type} onChange={(e) => setChargeForm({ ...chargeForm, type: e.target.value })}>
              <option value="ACCOMMODATION">Accommodation</option>
              <option value="ELECTRICITY">Electricity</option>
              <option value="LAUNDRY">Laundry</option>
              <option value="OTHER">Other</option>
            </SelectField>
            <TextField label="Amount (R)" type="number" min="0" step="0.01" value={chargeForm.amount} onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })} />
            <TextField label="Period" placeholder="YYYY-MM" value={chargeForm.period} onChange={(e) => setChargeForm({ ...chargeForm, period: e.target.value })} />
            <button className="btn-primary w-full" disabled={chargeMutation.isPending || !chargeForm.amount || !chargeForm.period} onClick={() => chargeMutation.mutate()}>
              <Plus size={16} /> {chargeMutation.isPending ? 'Adding…' : 'Add charge'}
            </button>
          </>
        ) : (
          <>
            <TextField label="Amount (R)" type="number" min="0" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
            <TextField label="Description" placeholder="e.g. Accommodation — March" value={paymentForm.description} onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })} />
            <button className="btn-primary w-full" disabled={paymentMutation.isPending || !paymentForm.amount || !paymentForm.description} onClick={() => paymentMutation.mutate()}>
              <Plus size={16} /> {paymentMutation.isPending ? 'Saving…' : 'Record payment'}
            </button>
          </>
        )}
      </div>

      {balance && balance.charges.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Recent charges</h3>
          <ul className="space-y-1 text-sm">
            {balance.charges.slice(0, 5).map((c) => (
              <li key={c.id} className="flex justify-between">
                <span className="text-gray-600">
                  {titleCase(c.type)} — {c.period}
                </span>
                <span className="font-medium text-gray-900">{formatCurrency(c.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {balance && balance.payments.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Recent payments</h3>
          <ul className="space-y-1 text-sm">
            {balance.payments.slice(0, 5).map((p) => (
              <li key={p.id} className="flex justify-between">
                <span className="text-gray-600">
                  {p.description} — {formatDate(p.paidAt)}
                </span>
                <span className="font-medium text-gray-900">{formatCurrency(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
