import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, Circle, X } from 'lucide-react';
import clsx from 'clsx';
import { getMyApplication } from '@/services/applications.service';
import PageHeader from '@/components/PageHeader';
import { formatDate } from '@/utils/format';
import type { ApplicationStatus } from '@/types';

const STEPS: { key: ApplicationStatus | 'SUBMITTED'; label: string }[] = [
  { key: 'SUBMITTED', label: 'Application submitted' },
  { key: 'DOCUMENTS_VERIFIED', label: 'Documents verified' },
  { key: 'APPROVED', label: 'Application approved' },
  { key: 'ROOM_ASSIGNED', label: 'Room assigned' },
];

// Status order used to decide which tracker steps are "done". Approval is
// folded into ROOM_ASSIGNED by the backend (see applications.controller.ts),
// so reaching ROOM_ASSIGNED lights up both the "approved" and "room
// assigned" steps.
const ORDER: Record<string, number> = {
  SUBMITTED: 0,
  DOCUMENTS_VERIFIED: 1,
  APPROVED: 2,
  ROOM_ASSIGNED: 3,
};

export default function ApplicationStatusPage() {
  const navigate = useNavigate();
  const { data: application, isLoading } = useQuery({ queryKey: ['application', 'me'], queryFn: getMyApplication });

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>;

  if (!application) {
    return (
      <div>
        <PageHeader title="My Application" />
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-500">You haven't submitted an accommodation application yet.</p>
          <button className="btn-primary mt-4" onClick={() => navigate('/register')}>
            Start an application
          </button>
        </div>
      </div>
    );
  }

  if (application.status === 'REJECTED') {
    return (
      <div>
        <PageHeader title="My Application" />
        <div className="card p-6">
          <div className="flex items-center gap-2 text-red-600">
            <X size={18} />
            <p className="font-medium">Your application was not approved</p>
          </div>
          {application.rejectionReason && <p className="mt-2 text-sm text-gray-600">Reason: {application.rejectionReason}</p>}
          <p className="mt-3 text-sm text-gray-500">
            Contact the accommodation office if you believe this was a mistake, or submit a new application once any
            issues are resolved.
          </p>
        </div>
      </div>
    );
  }

  const currentOrder = ORDER[application.status] ?? 0;

  return (
    <div>
      <PageHeader title="My Application" subtitle={`Submitted ${formatDate(application.submittedAt)}`} />

      <div className="card p-6">
        <ol className="space-y-5">
          {STEPS.map((step, i) => {
            const stepOrder = ORDER[step.key];
            const done = stepOrder <= currentOrder;
            return (
              <li key={step.key} className="flex items-start gap-3">
                <div
                  className={clsx(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                    done ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-gray-300'
                  )}
                >
                  {done ? <Check size={14} /> : <Circle size={8} fill="currentColor" />}
                </div>
                <div>
                  <p className={clsx('text-sm font-medium', done ? 'text-gray-900' : 'text-gray-400')}>{step.label}</p>
                  {step.key === 'SUBMITTED' && <p className="text-xs text-gray-400">{formatDate(application.submittedAt)}</p>}
                  {step.key === 'ROOM_ASSIGNED' && application.status === 'ROOM_ASSIGNED' && application.bed && (
                    <div className="mt-1 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                      {application.bed.room?.building?.name} — Room {application.bed.room?.roomNumber} — Bed{' '}
                      {application.bed.label}
                      <br />
                      Move-in date: {formatDate(application.moveInDate)}
                    </div>
                  )}
                </div>
                {i < STEPS.length - 1 && <span className="sr-only">then</span>}
              </li>
            );
          })}
        </ol>
      </div>

      {application.documents.length > 0 && (
        <div className="card mt-4 p-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Submitted documents</h2>
          <ul className="space-y-2 text-sm">
            {application.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between">
                <span className="text-gray-600">{d.fileName}</span>
                <a
                  href={`${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ?? 'http://localhost:3001'}${d.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
