import type { ReactNode } from "react";
export function FormField({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode }) {
  return <div className="space-y-1.5"><label className="block text-sm font-medium text-slate-800" htmlFor={htmlFor}>{label}</label>{children}{error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}{!error && hint ? <p className="text-xs text-slate-500">{hint}</p> : null}</div>;
}
