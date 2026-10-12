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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 shadow-xl">

        {/* ── Left: photo panel ── */}
        <div className="relative hidden w-1/2 md:block">
          <img
            src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900&q=80"
            alt="Student studying"
            className="h-full w-full object-cover"
          />
          {/* Warm brand overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom right, #ee772455, #b4459355)' }}
          />
          {/* Caption */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h2 className="text-xl font-semibold leading-snug">
              Your home away<br />from home.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Safe, comfortable student accommodation managed for you.
            </p>
          </div>
        </div>

        {/* ── Right: form panel ── */}
        <div className="flex w-full flex-col justify-center bg-white px-8 py-10 md:w-1/2">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-white">
              <Building2 size={24} />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Student Accommodation</h1>
            <p className="text-sm text-gray-500">Sign in to your portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-400">
            <p className="mb-1 font-medium text-gray-500">Demo logins (after running the seed script)</p>
            <p>Resident: phathu@accommodation.test / Resident123!</p>
            <p>Admin: admin@accommodation.test / Admin123!</p>
            <p>Security: security@accommodation.test / Security123!</p>
          </div>
        </div>

      </div>
    </div>
  );
}