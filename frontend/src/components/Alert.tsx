import clsx from 'clsx';

type Tone = 'error' | 'success' | 'info';

const toneClasses: Record<Tone, string> = {
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function Alert({ tone = 'info', children }: { tone?: Tone; children: React.ReactNode }) {
  return <div className={clsx('rounded-lg border px-3 py-2 text-sm', toneClasses[tone])}>{children}</div>;
}
