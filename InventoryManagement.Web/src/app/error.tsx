"use client";
import { ErrorState } from "@/components/ui/states";
import { messages as m } from "@/lib/i18n";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState message={m.common.unknownError} onRetry={reset} />;
}
