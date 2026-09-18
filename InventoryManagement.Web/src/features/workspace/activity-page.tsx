"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import {
  useCompany,
  useCompanyText,
} from "@/features/companies/company-provider";
import { useI18n } from "@/lib/i18n/provider";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/states";
type Entry = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorSubjectId: string | null;
  createdAtUtc: string;
};
export function ActivityPage() {
  const t = useCompanyText();
  const { company, session } = useCompany();
  const { formatDate } = useI18n();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["activity", company?.id, page],
    queryFn: () =>
      apiClient<{ items: Entry[]; totalCount: number }>(
        `/api/workspace/activity?page=${page}`,
      ),
  });
  const types: Record<string, string> = {
    Product: t("Ürün", "Product"),
    Warehouse: t("Depo", "Warehouse"),
    Supplier: t("Tedarikçi", "Supplier"),
    Stock: t("Stok", "Stock"),
    StockMovement: t("Stok hareketi", "Stock movement"),
    PurchaseOrder: t("Satın alma", "Purchase order"),
    PurchaseOrderItem: t("Sipariş kalemi", "Order item"),
    KnowledgeDocument: t("Bilgi kaynağı", "Knowledge resource"),
    Company: t("Şirket", "Company"),
    CompanyMember: t("Üyelik", "Membership"),
  };
  const actions: Record<string, string> = {
    Added: t("Oluşturuldu", "Created"),
    Modified: t("Güncellendi", "Updated"),
    Deleted: t("Silindi", "Deleted"),
  };
  const routes: Record<string, string> = {
    Product: "products",
    Warehouse: "warehouses",
    Supplier: "suppliers",
    PurchaseOrder: "purchase-orders",
    KnowledgeDocument: "knowledge",
  };
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">
          {t("İşlem geçmişi", "Activity history")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {t(
            "Bu özellik etkinleştirildikten sonraki değişiklikler. Kayıtlar salt okunurdur.",
            "Changes recorded since this feature was enabled. Entries are read-only.",
          )}
        </p>
      </header>
      {query.isPending ? (
        <LoadingState />
      ) : query.error ? (
        <ErrorState
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          title={t("Henüz işlem yok", "No activity yet")}
          description={t(
            "Şirket verileri güncellendikçe işlemler burada görünür.",
            "Changes to company data will appear here.",
          )}
        />
      ) : (
        <section className="panel divide-y divide-line">
          {query.data.items.map((e) => (
            <article
              key={e.id}
              className="flex flex-wrap justify-between gap-3 p-5"
            >
              <div>
                <p className="font-medium">
                  {types[e.entityType] ?? e.entityType} ·{" "}
                  {actions[e.action] ?? e.action}
                </p>
                <p className="mt-1 break-all text-xs text-muted">
                  {e.actorSubjectId === session?.subjectId
                    ? t("Siz", "You")
                    : (e.actorSubjectId ?? t("Sistem", "System"))}
                </p>
                {routes[e.entityType] && e.action !== "Deleted" && (
                  <Link
                    href={`/${routes[e.entityType]}/${e.entityId}`}
                    className="mt-2 block text-sm text-brand"
                  >
                    {t("Kaydı aç", "Open record")}
                  </Link>
                )}
              </div>
              <time className="text-xs text-muted" dateTime={e.createdAtUtc}>
                {formatDate(e.createdAtUtc)}
              </time>
            </article>
          ))}
          <Pagination
            page={page}
            pageSize={20}
            total={query.data.totalCount}
            onChange={setPage}
          />
        </section>
      )}
    </div>
  );
}
