"use client";
import { useState, type ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { makeStore } from "@/store";
import { I18nProvider } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { CompanyProvider } from "@/features/companies/company-provider";
import { RealtimeProvider } from "@/features/realtime/realtime-provider";
import type { AuthConfig } from "@/features/auth/types/auth";
export function Providers({
  children,
  locale,
  authConfig,
}: {
  children: ReactNode;
  locale: Locale;
  authConfig: AuthConfig | null;
}) {
  const [queryClient] = useState(createQueryClient);
  const [store] = useState(makeStore);
  return (
    <I18nProvider locale={locale}>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider config={authConfig}>
            <CompanyProvider>
              <RealtimeProvider>{children}</RealtimeProvider>
            </CompanyProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </I18nProvider>
  );
}
