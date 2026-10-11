import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateMe } from '@/services/residents.service';
import { apiErrorMessage } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import Alert from '@/components/Alert';
import { TextField } from '@/components/Field';
import { initials } from '@/utils/format';

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: resident } = useQuery({ queryKey: ['resident', 'me'], queryFn: getMe });
  const [form, setForm] = useState({ phone: '', course: '', school: '' });
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (resident) setForm({ phone: resident.phone, course: resident.course, school: resident.school });
  }, [resident]);

  const mutation = useMutation({
    mutationFn: () => updateMe(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resident', 'me'] });
      setMessage({ tone: 'success', text: 'Profile updated.' });
    },
    onError: (err) => setMessage({ tone: 'error', text: apiErrorMessage(err) }),
  });

  if (!resident) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div>
      <PageHeader title="Profile" />

      <div className="card max-w-lg p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
            {initials(resident.firstName, resident.lastName)}
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">
              {resident.firstName} {resident.lastName}
            </p>
            <p className="text-sm text-gray-500">{resident.studentNumber}</p>
          </div>
        </div>

        <div className="space-y-4">
          {message && <Alert tone={message.tone}>{message.text}</Alert>}
          <TextField label="Email" value={resident.user?.email ?? ''} disabled hint="Contact admin to change your email." />
          <TextField label="Student number" value={resident.studentNumber} disabled />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="Course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          <TextField label="School" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />

          <button className="btn-primary" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
