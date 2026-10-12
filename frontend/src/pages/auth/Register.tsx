import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Building2, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiErrorMessage } from '@/services/api';
import { submitApplication, uploadApplicationDocument } from '@/services/applications.service';
import { listBuildingOptions } from '@/services/accommodation.service';
import Alert from '@/components/Alert';
import clsx from 'clsx';

// Combined schema for the whole wizard — React Hook Form keeps all four
// steps' values in one form instance so nothing is lost moving back and
// forth, and each step validates only its own fields before advancing.
const schema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    studentNumber: z.string().min(1, 'Required'),
    phone: z.string().min(1, 'Required'),
    course: z.string().min(1, 'Required'),
    school: z.string().min(1, 'Required'),
    buildingPreference: z.string().optional(),
    roomTypePreference: z.string().optional(),
    moveInDate: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormData = z.infer<typeof schema>;

const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  1: ['email', 'password', 'confirmPassword'],
  2: ['firstName', 'lastName', 'studentNumber', 'phone', 'course', 'school'],
  3: ['buildingPreference', 'roomTypePreference', 'moveInDate'],
  4: [],
};

const STEP_TITLES = ['Create Account', 'Student Information', 'Select Accommodation', 'Upload Documents'];

interface Doc {
  type: 'STUDENT_ID' | 'PROOF_OF_REGISTRATION' | 'PROOF_OF_PAYMENT';
  label: string;
  file: File | null;
}

export default function Register() {
  const { register: doRegister } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([
    { type: 'STUDENT_ID', label: 'Student ID', file: null },
    { type: 'PROOF_OF_REGISTRATION', label: 'Proof of registration', file: null },
    { type: 'PROOF_OF_PAYMENT', label: 'Proof of payment / bursary letter', file: null },
  ]);

  const methods = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onTouched' });
  const { trigger, handleSubmit, getValues } = methods;

  async function next() {
    setServerError(null);
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) return;

    // Account + student info are both collected before we actually create
    // the account, right as the resident moves from step 2 to step 3.
    if (step === 2 && !accountCreated) {
      setSubmitting(true);
      try {
        const values = getValues();
        await doRegister({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          studentNumber: values.studentNumber,
          phone: values.phone,
          course: values.course,
          school: values.school,
        });
        setAccountCreated(true);
      } catch (err) {
        setServerError(apiErrorMessage(err, 'Could not create your account'));
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    setStep((s) => Math.min(4, s + 1));
  }

  function back() {
    setServerError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  const onFinalSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const application = await submitApplication({
        moveInDate: values.moveInDate || undefined,
        buildingPreference: values.buildingPreference || undefined,
        roomTypePreference: values.roomTypePreference || undefined,
      });

      await Promise.all(
        docs.filter((d) => d.file).map((d) => uploadApplicationDocument(application.id, d.type, d.file as File))
      );

      navigate('/resident/application');
    } catch (err) {
      setServerError(apiErrorMessage(err, 'Could not submit your application'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 shadow-xl">

        {/* ── Left: photo panel ── */}
        <div className="relative hidden w-2/5 md:flex md:flex-col md:justify-between">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&q=80"
            alt="University campus"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Warm brand overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom right, #ee772460, #b4459360)' }}
          />
          {/* Caption */}
          <div className="relative mt-auto p-8 text-white">
            <h2 className="text-xl font-semibold leading-snug">
              Start your<br />accommodation journey.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Complete the 4-step application and our staff will review it promptly.
            </p>
            {/* Mini step indicator on the image */}
            <div className="mt-5 flex gap-2">
              {STEP_TITLES.map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    'h-1.5 flex-1 rounded-full transition-all',
                    i + 1 <= step ? 'bg-white' : 'bg-white/30'
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-white/60">
              Step {step} of 4 — {STEP_TITLES[step - 1]}
            </p>
          </div>
        </div>

        {/* ── Right: wizard panel ── */}
        <div className="flex w-full flex-col bg-white px-8 py-8 md:w-3/5">
          {/* Header */}
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-white">
              <Building2 size={20} />
            </div>
            <h1 className="text-base font-semibold text-gray-900">Apply for Accommodation</h1>
          </div>

          {/* Stepper */}
          <Stepper step={step} />

          {/* Form */}
          <FormProvider {...methods}>
            <form onSubmit={(e) => e.preventDefault()} className="mt-5 space-y-4">
              {serverError && <Alert tone="error">{serverError}</Alert>}

              {step === 1 && <StepAccount />}
              {step === 2 && <StepStudentInfo />}
              {step === 3 && <StepAccommodation />}
              {step === 4 && <StepDocuments docs={docs} setDocs={setDocs} />}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 1 || submitting}
                  className="btn-secondary disabled:invisible"
                >
                  Back
                </button>
                {step < 4 ? (
                  <button type="button" onClick={next} disabled={submitting} className="btn-primary">
                    {submitting ? 'Please wait…' : 'Next'}
                  </button>
                ) : (
                  <button type="button" onClick={onFinalSubmit} disabled={submitting} className="btn-primary">
                    {submitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                )}
              </div>
            </form>
          </FormProvider>

          <p className="mt-5 text-center text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEP_TITLES.map((title, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={title} className="flex flex-1 items-center">
            <div
              className={clsx(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                done && 'bg-gradient-brand text-white',
                active && !done && 'bg-brand-50 text-brand-600 ring-2 ring-brand-500',
                !done && !active && 'bg-gray-100 text-gray-400'
              )}
            >
              {done ? <Check size={14} /> : n}
            </div>
            {n < STEP_TITLES.length && (
              <div className={clsx('mx-1 h-0.5 flex-1', done ? 'bg-gradient-brand' : 'bg-gray-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepAccount() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormData>();
  return (
    <>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>
      <div>
        <label className="label">Password</label>
        <input className="input" type="password" {...register('password')} />
        {errors.password && <p className="field-error">{errors.password.message}</p>}
      </div>
      <div>
        <label className="label">Confirm password</label>
        <input className="input" type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
      </div>
    </>
  );
}

function StepStudentInfo() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormData>();
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">First name</label>
          <input className="input" {...register('firstName')} />
          {errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="label">Last name</label>
          <input className="input" {...register('lastName')} />
          {errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <label className="label">Student number</label>
        <input className="input" {...register('studentNumber')} />
        {errors.studentNumber && <p className="field-error">{errors.studentNumber.message}</p>}
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" placeholder="+27 ..." {...register('phone')} />
        {errors.phone && <p className="field-error">{errors.phone.message}</p>}
      </div>
      <div>
        <label className="label">Course</label>
        <input className="input" placeholder="e.g. Advanced Diploma in App Development" {...register('course')} />
        {errors.course && <p className="field-error">{errors.course.message}</p>}
      </div>
      <div>
        <label className="label">School / Institution</label>
        <input className="input" placeholder="e.g. IIE Rosebank College" {...register('school')} />
        {errors.school && <p className="field-error">{errors.school.message}</p>}
      </div>
    </>
  );
}

function StepAccommodation() {
  const { register } = useFormContext<FormData>();
  const { data: buildings } = useQuery({ queryKey: ['buildings', 'public'], queryFn: listBuildingOptions });

  return (
    <>
      <div>
        <label className="label">Building preference</label>
        <select className="input" {...register('buildingPreference')}>
          <option value="">No preference</option>
          {buildings?.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name} — {b.address}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Room type preference (optional)</label>
        <select className="input" {...register('roomTypePreference')}>
          <option value="">No preference</option>
          <option value="SINGLE">Single room</option>
          <option value="SHARED_2">Shared — 2 beds</option>
          <option value="SHARED_3">Shared — 3 beds</option>
        </select>
      </div>
      <div>
        <label className="label">Preferred move-in date (optional)</label>
        <input className="input" type="date" {...register('moveInDate')} />
      </div>
      <p className="text-xs text-gray-400">
        This is a preference, not a guarantee — accommodation admin staff confirm your actual room and bed when they
        review your application.
      </p>
    </>
  );
}

function StepDocuments({ docs, setDocs }: { docs: Doc[]; setDocs: (d: Doc[]) => void }) {
  return (
    <>
      <p className="text-sm text-gray-500">
        Upload clear photos or PDFs of each document. You can also add these later from{' '}
        <span className="font-medium text-gray-700">My Application</span> if you don't have them to hand right now.
      </p>
      {docs.map((doc, i) => (
        <div key={doc.type}>
          <label className="label">{doc.label}</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="input cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-600 hover:file:bg-brand-100"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              const next = [...docs];
              next[i] = { ...doc, file };
              setDocs(next);
            }}
          />
          {doc.file && <p className="mt-1 text-xs text-green-600">Selected: {doc.file.name}</p>}
        </div>
      ))}
    </>
  );
}