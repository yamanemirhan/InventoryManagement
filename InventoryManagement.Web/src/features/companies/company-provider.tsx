"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/components/auth-provider";
import { apiClient } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/provider";

type Company = { id: string; name: string; role: string };
type Session = {
  subjectId: string;
  platformAdmin: boolean;
  companies: Company[];
};
const Context = createContext<{
  session?: Session;
  company?: Company;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  switchCompany: (id: string) => void;
} | null>(null);
export function CompanyProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const query = useQuery({
    queryKey: ["company-session", auth.client?.subject],
    enabled: auth.status === "authenticated",
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const session = await apiClient<Session>("/api/companies/session");
      const saved = sessionStorage.getItem("inventory-company");
      const sameUser =
        sessionStorage.getItem("inventory-company-user") === session.subjectId;
      const selected =
        (sameUser && session.companies.find((c) => c.id === saved)) ||
        session.companies[0];
      sessionStorage.setItem("inventory-company-user", session.subjectId);
      if (selected) sessionStorage.setItem("inventory-company", selected.id);
      else sessionStorage.removeItem("inventory-company");
      // A revoked membership must not leave an old company's mounted queries on screen.
      if (sameUser && saved && saved !== selected?.id)
        window.location.replace("/companies");
      return session;
    },
  });
  const session = auth.status === "authenticated" ? query.data : undefined;
  const company = session?.companies.find(
    (c) => c.id === sessionStorage.getItem("inventory-company"),
  );
  return (
    <Context.Provider
      value={{
        session,
        company,
        loading: query.isPending,
        error: query.error,
        retry: () => {
          void query.refetch();
        },
        switchCompany: (id) => {
          if (!session?.companies.some((c) => c.id === id)) return;
          sessionStorage.setItem("inventory-company", id);
          // A full navigation discards in-flight queries, forms and Redux state from the previous company.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign("/");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCompany() {
  const value = useContext(Context);
  if (!value) throw new Error("CompanyProvider is required.");
  return value;
}
export function useCompanyText() {
  const { locale } = useI18n();
  return (tr: string, en: string) => (locale === "tr" ? tr : en);
}
export function CompanySwitcher() {
  const { session, company, switchCompany } = useCompany();
  const t = useCompanyText();
  if (!session?.companies.length) return null;
  return (
    <label className="flex min-w-0 items-center gap-2 text-xs">
      <span className="sr-only">{t("Aktif şirket", "Active company")}</span>
      <select
        className="field max-w-[220px] truncate"
        value={company?.id ?? ""}
        onChange={(e) => switchCompany(e.target.value)}
      >
        {session.companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}

