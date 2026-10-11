import { useQuery } from '@tanstack/react-query';
import { getMyPayments } from '@/services/payments.service';
import PageHeader from '@/components/PageHeader';
import DataTable, { type Column } from '@/components/DataTable';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Payment } from '@/types';

export default function Payments() {
  const { data, isLoading } = useQuery({ queryKey: ['payments', 'me'], queryFn: getMyPayments });

  const columns: Column<Payment>[] = [
    { header: 'Date', cell: (p) => formatDate(p.paidAt) },
    { header: 'Description', cell: (p) => p.description },
    { header: 'Amount', cell: (p) => formatCurrency(p.amount), className: 'text-right font-medium text-gray-900' },
  ];

  return (
    <div>
      <PageHeader title="Payments" subtitle="Your full payment history." />
      <DataTable columns={columns} rows={data ?? []} rowKey={(p) => p.id} isLoading={isLoading} emptyMessage="No payments recorded yet." />
    </div>
  );
}
