import clsx from 'clsx';
import { titleCase } from '@/utils/format';

type Tone = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';

const toneClasses: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
};

export function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', toneClasses[tone])}>
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  // Applications
  SUBMITTED: 'blue',
  DOCUMENTS_VERIFIED: 'purple',
  APPROVED: 'green',
  REJECTED: 'red',
  ROOM_ASSIGNED: 'green',
  // Complaints
  OPEN: 'yellow',
  ASSIGNED: 'blue',
  IN_PROGRESS: 'purple',
  RESOLVED: 'green',
  CLOSED: 'gray',
  // Visitors
  AWAITING_CHECKIN: 'yellow',
  CHECKED_IN: 'green',
  CHECKED_OUT: 'gray',
  NO_SHOW: 'red',
  // Priority
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'yellow',
  URGENT: 'red',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'gray'}>{titleCase(status)}</Badge>;
}
