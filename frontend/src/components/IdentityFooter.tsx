import { initials } from '@/utils/format';

// The bottom strip of the sidebar — makes every page instantly personal.
// Resident: name, course, school. Admin/Security: email + role badge.
export function ResidentIdentityFooter({
  firstName,
  lastName,
  course,
  school,
}: {
  firstName: string;
  lastName: string;
  course: string;
  school: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
        {initials(firstName, lastName)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">
          {firstName} {lastName}
        </p>
        <p className="truncate text-xs text-gray-500">{course}</p>
        <p className="truncate text-xs text-gray-400">{school}</p>
      </div>
    </div>
  );
}

export function StaffIdentityFooter({ email, role }: { email: string; role: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
        {email[0]?.toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{email}</p>
        <p className="truncate text-xs text-gray-400">{role === 'ADMIN' ? 'Accommodation staff' : 'Security officer'}</p>
      </div>
    </div>
  );
}
