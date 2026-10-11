import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface WrapperProps {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}

export function FieldWrapper({ label, error, children, hint }: WrapperProps) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };
export function TextField({ label, error, hint, ...rest }: InputProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <input className="input" {...rest} />
    </FieldWrapper>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string };
export function TextAreaField({ label, error, hint, ...rest }: TextareaProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <textarea className="input min-h-[96px] resize-y" {...rest} />
    </FieldWrapper>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; hint?: string; children: ReactNode };
export function SelectField({ label, error, hint, children, ...rest }: SelectProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <select className="input" {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
}
