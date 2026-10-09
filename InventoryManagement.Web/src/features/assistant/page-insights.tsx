"use client";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { useCompany, useCompanyText } from "@/features/companies/company-provider";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/features/auth/components/auth-provider";
import { pageContext, openInvo, type AssistantInsights } from "./assistant-types";

export function PageInsights() {
  const { company, loading, error } = useCompany();
  const auth = useAuth();
  const pathname = usePathname();
  const page = pageContext(pathname);
  const enabled = auth.status === "authenticated" && !!company && !loading && !error
    && ["/", "/products", "/stocks", "/purchase-orders", "/reports", "/knowledge"].includes(pathname);
  return enabled && company ? <Insights key={`${company.id}-${page}`} companyId={company.id} page={page} /> : null;
}
function Insights({ companyId, page }: { companyId: string; page: string }) {
  const t = useCompanyText();
  const { locale, formatDate } = useI18n();
  const query = useQuery({ queryKey: ["assistant-insights", companyId, page, locale],
    queryFn: ({ signal }) => apiClient<AssistantInsights>(`/api/assistant/insights?locale=${locale}&page=${page}`, { signal, cache: "no-store" }),
    staleTime: 30000, refetchOnWindowFocus: true, retry: false });
  return <section className="rounded-2xl border border-brand/20 bg-brand-soft/30 p-5" aria-labelledby="invo-insights-title">
    <header className="flex items-start justify-between gap-3">
      <div><h2 id="invo-insights-title" className="flex items-center gap-2 text-sm font-semibold"><Lightbulb className="size-4 text-brand" />{t("Invo · İşe yarayan öneriler", "Invo · Practical insights")}</h2>
        <p className="mt-1 text-xs leading-5 text-muted">{t("Güncel şirket kayıtlarından hesaplanır; bulut kotası tüketmez. İşlem yapmadan önce kontrol et.", "Calculated from current company records; no cloud quota used. Review before acting.")}</p></div>
      <button type="button" disabled={query.isFetching} aria-label={t("Önerileri yenile", "Refresh insights")} onClick={() => void query.refetch()} className="rounded-lg p-2 text-brand disabled:opacity-40"><RefreshCw className={`size-4 ${query.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} /></button>
    </header>
    {query.isPending ? <p className="mt-3 text-xs text-muted" role="status">{t("Kayıtlar inceleniyor…", "Reviewing records…")}</p>
      : query.isError ? <p className="mt-3 text-xs text-danger" role="status">{t("Öneriler alınamadı. Yenileyebilirsin.", "Insights unavailable. Try refreshing.")}</p>
      : query.data.items.length === 0 ? <p className="mt-3 text-xs text-muted">{t("Kontrol edilen kurallarda önerilecek bir durum bulunmadı. Bu, tüm risklerin kontrol edildiği anlamına gelmez.", "No issue matched the current rules. This does not mean every risk was checked.")}</p>
      : <div className="mt-4 grid gap-3 xl:grid-cols-2">{query.data.items.map(item => <article key={item.id} className="rounded-xl border border-line bg-surface p-4">
        <p className={`text-xs font-semibold ${item.severity === "critical" ? "text-danger" : item.severity === "warning" ? "text-warning" : "text-brand"}`}>{item.title}</p>
        <p className="mt-2 text-xs leading-6 text-muted">{item.detail}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4"><Link href={item.href} className="text-xs font-semibold text-brand">{t("İlgili kayıtları aç", "Open records")} →</Link>
          <button type="button" onClick={() => openInvo(companyId, item.question)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand"><Sparkles className="size-3" />{t("Invo ile incele", "Review with Invo")}</button></div>
      </article>)}</div>}
    {query.data && <p className="mt-3 text-[10px] text-muted">{t("Veri zamanı", "Retrieved")}: {formatDate(query.data.retrievedAtUtc)}</p>}
  </section>;
}
