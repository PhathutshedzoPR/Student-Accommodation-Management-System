import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { getComplaint } from '@/services/complaints.service';
import { StatusBadge } from '@/components/Badge';
import { formatDateTime, titleCase } from '@/utils/format';

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => getComplaint(id as string),
    enabled: !!id,
  });

  if (isLoading || !complaint) return <p className="text-sm text-gray-400">Loading…</p>;

  const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ?? 'http://localhost:3001';

  return (
    <div>
      <Link to="/resident/complaints" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Back to complaints
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-gray-400">{complaint.id}</p>
            <h1 className="mt-1 text-lg font-semibold text-gray-900">{complaint.title}</h1>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-400">Category</dt>
            <dd className="font-medium text-gray-900">{titleCase(complaint.category)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Logged</dt>
            <dd className="font-medium text-gray-900">{formatDateTime(complaint.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Last updated</dt>
            <dd className="font-medium text-gray-900">{formatDateTime(complaint.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Assigned to</dt>
            <dd className="font-medium text-gray-900">{complaint.assignee?.email ?? 'Not yet assigned'}</dd>
          </div>
        </dl>

        <div className="mt-5">
          <h2 className="mb-1.5 text-sm font-semibold text-gray-900">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-600">{complaint.description}</p>
        </div>

        {complaint.photoUrl && (
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Photo</h2>
            <img src={`${apiOrigin}${complaint.photoUrl}`} alt="Complaint evidence" className="max-h-64 rounded-lg border border-gray-200" />
          </div>
        )}
      </div>
    </div>
  );
}
