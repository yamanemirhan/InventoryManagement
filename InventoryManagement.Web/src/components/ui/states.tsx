import { PackageOpen, RefreshCw, CircleAlert } from "lucide-react";
import { Button } from "./button";
import { messages as m } from "@/lib/i18n";
export function LoadingState({ label = m.common.loading }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="panel overflow-hidden">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <div className="flex items-center justify-between border-b border-line p-6">
          <div className="skeleton h-9 w-64 max-w-[65%]" />
          <div className="skeleton h-8 w-20" />
        </div>
        <div className="space-y-0">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-5 border-b border-line/60 p-6 last:border-0"
            >
              <div className="skeleton size-9 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-2/5" />
                <div className="skeleton h-2.5 w-1/4" />
              </div>
              <div className="skeleton h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="panel flex min-h-72 flex-col items-center justify-center p-10 text-center">
      <div className="mb-5 rounded-2xl bg-brand-soft p-4">
        <PackageOpen className="size-8 text-brand" strokeWidth={1.4} />
      </div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
    </div>
  );
}
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="panel flex min-h-64 flex-col items-center justify-center p-8 text-center"
    >
      <CircleAlert className="mb-4 size-8 text-danger" />
      <h2 className="font-semibold">{m.common.loadError}</h2>
      <p className="mt-2 max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <Button className="mt-5" variant="secondary" onClick={onRetry}>
          <RefreshCw className="size-4" />
          {m.common.retry}
        </Button>
      )}
    </div>
  );
}
