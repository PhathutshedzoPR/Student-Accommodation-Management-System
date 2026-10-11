import type { ReactNode } from 'react';
import clsx from 'clsx';

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}

const toneClasses = {
  default: 'bg-brand-50 text-brand-600',
  warning: 'bg-yellow-50 text-yellow-600',
  danger: 'bg-red-50 text-red-600',
  success: 'bg-green-50 text-green-600',
};

export default function StatCard({ label, value, sub, icon, tone = 'default' }: Props) {
  return (
    <div className="card flex items-start justify-between p-5">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      </div>
      {icon && <div className={clsx('flex h-10 w-10 items-center justify-center rounded-lg text-lg', toneClasses[tone])}>{icon}</div>}
    </div>
  );
}
