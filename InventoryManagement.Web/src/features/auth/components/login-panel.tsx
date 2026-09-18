"use client";
import { Boxes, ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useCompanyText } from "@/features/companies/company-provider";
import { useAuth } from "./auth-provider";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
export function LoginPanel() {
  const auth = useAuth();
  const t = useCompanyText();
  const { m } = useI18n();
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const run = async (action: () => Promise<void>) => {
    setError(false);
    setPending(true);
    try {
      await action();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };
  const disabled = pending || auth.status !== "anonymous";
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-md flex-col justify-center">
      <div className="panel p-8 sm:p-10">
        <div className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Boxes className="size-8" strokeWidth={1.4} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {m.auth.title}
        </h1>
        <p className="mb-8 mt-3 text-sm leading-6 text-muted">
          {m.auth.description}
        </p>
        {(auth.status === "error" ||
          auth.status === "configuration" ||
          error) && (
          <div className="mb-5">
            <Alert
              tone="error"
              title={
                auth.status === "configuration"
                  ? m.auth.configuration
                  : error
                    ? t(
                        "Giriş hizmeti şu anda yanıt vermiyor. Biraz sonra yeniden deneyin.",
                        "Sign-in service is unavailable. Please try again shortly.",
                      )
                    : m.auth.error
              }
            />
          </div>
        )}
        {auth.status === "loading" ? (
          <div role="status" className="space-y-4">
            <span className="sr-only">{m.auth.checking}</span>
            <div className="skeleton h-11 w-full" />
            <div className="skeleton h-11 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              className="w-full"
              disabled={disabled}
              onClick={() => run(() => auth.login())}
            >
              {m.auth.login}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={disabled || !auth.googleEnabled}
              onClick={() => run(() => auth.login(true))}
            >
              <span aria-hidden="true" className="font-bold">
                G
              </span>
              {m.auth.google}
            </Button>
            {!auth.googleEnabled && (
              <p className="text-xs leading-5 text-muted">
                {m.auth.googleUnavailable}
              </p>
            )}
            <Button
              variant="ghost"
              className="w-full"
              disabled={disabled}
              onClick={() => run(auth.register)}
            >
              {m.auth.register}
            </Button>
            {auth.status === "error" && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => location.reload()}
              >
                {m.auth.retry}
              </Button>
            )}
          </div>
        )}
        <p className="mt-8 flex items-start gap-2 border-t border-line pt-5 text-xs leading-5 text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          {m.auth.secure}
        </p>
      </div>
    </section>
  );
}
