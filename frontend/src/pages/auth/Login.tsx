import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiErrorMessage } from '@/services/api';
import Alert from '@/components/Alert';
import type { Role } from '@/types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

const HOME: Record<Role, string> = {
  RESIDENT: '/resident/dashboard',
  ADMIN: '/admin/dashboard',
  SECURITY: '/security/dashboard',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      const role = await login(data.email, data.password);
      navigate(HOME[role]);
    } catch (err) {
      setServerError(apiErrorMessage(err, 'Invalid email or password'));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Building2 size={24} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Student Accommodation</h1>
          <p className="text-sm text-gray-500">Sign in to your portal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
          {serverError && <Alert tone="error">{serverError}</Alert>}

          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-gray-400">
            New student?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:underline">
              Apply for accommodation
            </Link>
          </p>
        </form>

        <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-white p-3 text-xs text-gray-400">
          <p className="mb-1 font-medium text-gray-500">Demo logins (after running the seed script)</p>
          <p>Resident: phathu@accommodation.test / Resident123!</p>
          <p>Admin: admin@accommodation.test / Admin123!</p>
          <p>Security: security@accommodation.test / Security123!</p>
        </div>
      </div>
    </div>
  );
}
