import type { InputHTMLAttributes } from "react";
export function AuthField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="form-field">
      {label}
      <input {...props} />
    </label>
  );
}
