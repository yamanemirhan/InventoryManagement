import type { ReactNode } from "react";
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 pb-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {description}
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
