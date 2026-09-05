import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const describedBy = error
    ? htmlFor + "-error"
    : hint
      ? htmlFor + "-hint"
      : undefined;
  const control = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          "aria-invalid"?: boolean;
          "aria-describedby"?: string;
        }>,
        { "aria-invalid": !!error, "aria-describedby": describedBy },
      )
    : children;
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-ink" htmlFor={htmlFor}>
        {label}
      </label>
      {control}
      {error ? (
        <p id={htmlFor + "-error"} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={htmlFor + "-hint"} className="text-xs leading-5 text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
