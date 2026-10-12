import { useQuery } from '@tanstack/react-query';
import { getReports } from '@/services/reports.service';
import PageHeader from '@/components/PageHeader';
import { titleCase } from '@/utils/format';

// Tone colours map to distinct steps in the brand gradient so every chart
// feels like part of the same palette rather than a rainbow of unrelated hues.
function Bar({ label, count, max, tone = 'bg-brand-400' }: { label: string; count: number; max: number; tone?: string }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-gray-600">{titleCase(label)}</span>
        <span className="font-medium text-gray-900">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Reports() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'reports'], queryFn: getReports });

  if (isLoading || !data) return <p className="text-sm text-gray-400">Loading…</p>;

  const maxComplaintCat    = Math.max(1, ...data.complaintsByCategory.map((c) => c.count));
  const maxComplaintStatus = Math.max(1, ...data.complaintsByStatus.map((c) => c.count));
  const maxAppStatus       = Math.max(1, ...data.applicationsByStatus.map((c) => c.count));
  const maxVisitorStatus   = Math.max(1, ...data.visitorsByStatus.map((c) => c.count));

  return (
    <div>
      <PageHeader title="Reports" subtitle="Breakdowns across complaints, applications and visitors." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Complaints by category — orange (gradient start) */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Complaints by category</h2>
          <div className="space-y-3">
            {data.complaintsByCategory.map((c) => (
              <Bar key={c.category} label={c.category} count={c.count} max={maxComplaintCat} tone="bg-brand-400" />
            ))}
          </div>
        </div>

        {/* Complaints by status — red (gradient mid) */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Complaints by status</h2>
          <div className="space-y-3">
            {data.complaintsByStatus.map((c) => (
              <Bar key={c.status} label={c.status} count={c.count} max={maxComplaintStatus} tone="bg-brand-500" />
            ))}
          </div>
        </div>

        {/* Applications by status — pink (gradient mid) */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Applications by status</h2>
          <div className="space-y-3">
            {data.applicationsByStatus.map((c) => (
              <Bar key={c.status} label={c.status} count={c.count} max={maxAppStatus} tone="bg-brand-600" />
            ))}
          </div>
        </div>

        {/* Visitors by status — purple (gradient end) */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Visitors by status</h2>
          <div className="space-y-3">
            {data.visitorsByStatus.map((c) => (
              <Bar key={c.status} label={c.status} count={c.count} max={maxVisitorStatus} tone="bg-brand-700" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}