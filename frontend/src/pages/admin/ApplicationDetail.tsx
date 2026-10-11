import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileCheck, Check, X } from 'lucide-react';
import { getApplication, listAvailableBeds, reviewApplication } from '@/services/applications.service';
import { apiErrorMessage } from '@/services/api';
import { StatusBadge } from '@/components/Badge';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import { TextField, SelectField, TextAreaField } from '@/components/Field';
import { formatDate, formatDateTime, titleCase } from '@/utils/format';

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [bedId, setBedId] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: application, isLoading } = useQuery({
    queryKey: ['admin', 'application', id],
    queryFn: () => getApplication(id as string),
    enabled: !!id,
  });

  const { data: beds } = useQuery({ queryKey: ['admin', 'beds', 'available'], queryFn: listAvailableBeds, enabled: approveOpen });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'application', id] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] });
  }

  const verifyDocs = useMutation({
    mutationFn: () => reviewApplication(id as string, { action: 'VERIFY_DOCUMENTS' }),
    onSuccess: invalidate,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const approve = useMutation({
    mutationFn: () => reviewApplication(id as string, { action: 'APPROVE', bedId, moveInDate: moveInDate || undefined }),
    onSuccess: () => {
      invalidate();
      setApproveOpen(false);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const reject = useMutation({
    mutationFn: () => reviewApplication(id as string, { action: 'REJECT', rejectionReason }),
    onSuccess: () => {
      invalidate();
      setRejectOpen(false);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (isLoading || !application) return <p className="text-sm text-gray-400">Loading…</p>;

  const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ?? 'http://localhost:3001';
  const canVerify = application.status === 'SUBMITTED';
  const canApprove = application.status === 'SUBMITTED' || application.status === 'DOCUMENTS_VERIFIED';
  const canReject = application.status !== 'REJECTED' && application.status !== 'ROOM_ASSIGNED';

  return (
    <div>
      <Link to="/admin/applications" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Back to applications
      </Link>

      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {application.resident?.firstName} {application.resident?.lastName}
            </h1>
            <p className="text-sm text-gray-500">{application.resident?.studentNumber} · {application.resident?.phone}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gray-400">Submitted</dt>
            <dd className="font-medium text-gray-900">{formatDate(application.submittedAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Building preference</dt>
            <dd className="font-medium text-gray-900">{application.buildingPreference ?? 'No preference'}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Room type preference</dt>
            <dd className="font-medium text-gray-900">{application.roomTypePreference ?? 'No preference'}</dd>
          </div>
          {application.bed && (
            <div>
              <dt className="text-gray-400">Room assigned</dt>
              <dd className="font-medium text-gray-900">
                {application.bed.room?.building?.name} — {application.bed.room?.roomNumber}
                {application.bed.label}
              </dd>
            </div>
          )}
          {application.reviewedAt && (
            <div>
              <dt className="text-gray-400">Reviewed</dt>
              <dd className="font-medium text-gray-900">{formatDateTime(application.reviewedAt)}</dd>
            </div>
          )}
          {application.rejectionReason && (
            <div className="col-span-2">
              <dt className="text-gray-400">Rejection reason</dt>
              <dd className="font-medium text-red-600">{application.rejectionReason}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Documents</h2>
          {application.documents.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded.</p>
          ) : (
            <ul className="space-y-2">
              {application.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-gray-700">
                    <FileCheck size={15} className="text-gray-400" /> {titleCase(d.type)} — {d.fileName}
                  </span>
                  <a href={`${apiOrigin}${d.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:underline">
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
          {canVerify && (
            <button className="btn-secondary" disabled={verifyDocs.isPending} onClick={() => verifyDocs.mutate()}>
              <FileCheck size={16} /> Mark documents verified
            </button>
          )}
          {canApprove && (
            <button className="btn-primary" onClick={() => setApproveOpen(true)}>
              <Check size={16} /> Approve &amp; assign bed
            </button>
          )}
          {canReject && (
            <button className="btn-danger" onClick={() => setRejectOpen(true)}>
              <X size={16} /> Reject
            </button>
          )}
        </div>
      </div>

      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve application"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setApproveOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={!bedId || approve.isPending} onClick={() => approve.mutate()}>
              {approve.isPending ? 'Approving…' : 'Approve & assign'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectField label="Assign bed" value={bedId} onChange={(e) => setBedId(e.target.value)}>
            <option value="">Select an available bed…</option>
            {beds?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.room?.building?.name} — Room {b.room?.roomNumber} — Bed {b.label}
              </option>
            ))}
          </SelectField>
          {beds?.length === 0 && <p className="text-xs text-yellow-600">No vacant beds right now — add a room first.</p>}
          <TextField label="Move-in date" type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject application"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </button>
            <button className="btn-danger" disabled={reject.isPending} onClick={() => reject.mutate()}>
              {reject.isPending ? 'Rejecting…' : 'Reject application'}
            </button>
          </>
        }
      >
        <TextAreaField label="Reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Explain why this application is being rejected…" />
      </Modal>

      {application.status === 'REJECTED' && (
        <button className="mt-4 text-sm text-gray-400 hover:text-gray-600" onClick={() => navigate('/admin/applications')}>
          Done
        </button>
      )}
    </div>
  );
}
