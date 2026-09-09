"use client";
import { ErrorState } from "@/components/ui/states";
import { useI18n } from "@/lib/i18n/provider";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { m } = useI18n();

  return <ErrorState message={m.common.unknownError} onRetry={reset} />;
}
