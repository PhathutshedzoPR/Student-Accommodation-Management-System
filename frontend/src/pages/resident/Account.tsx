import { useQuery } from '@tanstack/react-query';
import { getMyBalance } from '@/services/payments.service';
import PageHeader from '@/components/PageHeader';
import { formatCurrency, formatDate, titleCase } from '@/utils/format';

export default function Account() {
  const { data, isLoading } = useQuery({ queryKey: ['account', 'balance'], queryFn: getMyBalance });

  return (
    <div>
      <PageHeader title="My Account" subtitle="Everything you owe and why." />

      {isLoading || !data ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="card max-w-md p-6">
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(data.balance)}</p>
          </div>

          <div className="card mt-4 overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Charge breakdown</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-2 text-left">Type</th>
                  <th className="px-5 py-2 text-left">Period</th>
                  <th className="px-5 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.charges.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-gray-400">
                      No charges on file.
                    </td>
                  </tr>
                ) : (
                  data.charges.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-2.5 text-gray-700">{titleCase(c.type)}</td>
                      <td className="px-5 py-2.5 text-gray-500">{c.period}</td>
                      <td className="px-5 py-2.5 text-right font-medium text-gray-900">{formatCurrency(c.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.charges.length > 0 && (
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td className="px-5 py-2.5" colSpan={2}>
                      Total due
                    </td>
                    <td className="px-5 py-2.5 text-right">{formatCurrency(data.balance)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="card mt-4 overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Recent payments</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-2 text-left">Date</th>
                  <th className="px-5 py-2 text-left">Description</th>
                  <th className="px-5 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.payments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-gray-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.payments.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-2.5 text-gray-500">{formatDate(p.paidAt)}</td>
                      <td className="px-5 py-2.5 text-gray-700">{p.description}</td>
                      <td className="px-5 py-2.5 text-right font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
