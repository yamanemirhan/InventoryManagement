"use client";
import Link from "next/link";
import { LowStockAlert } from "@/features/operations/reports";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Warehouse,
  UsersRound,
  Boxes,
  ClipboardList,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import {
  useCompany,
  useCompanyText,
} from "@/features/companies/company-provider";
import { useI18n } from "@/lib/i18n/provider";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/link-button";
import { ActionAccess, AdminOnly } from "@/features/auth/components/access";
type Dashboard = {
  products: number;
  warehouses: number;
  suppliers: number;
  unitsInStock: number;
  openOrders: number;
  outOfStockProducts: number;
  publishedDocuments: number;
};
export function DashboardPage() {
  const t = useCompanyText();
  const { company } = useCompany();
  const { formatNumber } = useI18n();
  const query = useQuery({
    queryKey: ["dashboard", company?.id],
    queryFn: () => apiClient<Dashboard>("/api/workspace/dashboard"),
    refetchOnWindowFocus: true,
  });
  if (query.isPending) return <LoadingState />;
  if (query.error)
    return (
      <ErrorState
        message={query.error.message}
        onRetry={() => void query.refetch()}
      />
    );
  const data = query.data;
  const cards = [
    {
      label: t("Ürün", "Products"),
      value: data.products,
      href: "/products",
      icon: Package,
    },
    {
      label: t("Depo", "Warehouses"),
      value: data.warehouses,
      href: "/warehouses",
      icon: Warehouse,
    },
    {
      label: t("Tedarikçi", "Suppliers"),
      value: data.suppliers,
      href: "/suppliers",
      icon: UsersRound,
    },
    {
      label: t("Toplam stok birimi", "Units in stock"),
      value: data.unitsInStock,
      href: "/stocks",
      icon: Boxes,
    },
    {
      label: t("Açık sipariş", "Open orders"),
      value: data.openOrders,
      href: "/purchase-orders",
      icon: ClipboardList,
    },
    {
      label: t("Yayınlanan bilgi kaynağı", "Published resources"),
      value: data.publishedDocuments,
      href: "/knowledge",
      icon: BookOpen,
    },
  ];
  return (
    <div className="space-y-7">
      <LowStockAlert />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">
            {company?.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {t("Genel bakış", "Overview")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t(
              "Şirketinizin stok, satın alma ve bilgi kaynakları.",
              "Your company's inventory, purchasing and shared resources.",
            )}
          </p>
        </div>
        <LinkButton secondary href="/companies">
          {t("Şirket ve ekip", "Company & team")}
        </LinkButton>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="panel group p-6 transition-colors hover:border-brand/40"
          >
            <div className="flex items-center justify-between text-muted">
              <span className="text-sm">{label}</span>
              <Icon size={20} />
            </div>
            <div className="mt-5 flex items-end justify-between">
              <strong className="text-3xl font-semibold">
                {formatNumber(value)}
              </strong>
              <ArrowRight size={18} className="text-brand" />
            </div>
          </Link>
        ))}
      </div>
      {data.outOfStockProducts > 0 && (
        <section className="panel flex flex-wrap items-center justify-between gap-4 border-brand/30 p-6">
          <div>
            <h2 className="font-semibold">
              {t("Stok kontrolü", "Stock review")}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t(
                `${formatNumber(data.outOfStockProducts)} ürünün hiçbir depoda stoku yok.`,
                `${formatNumber(data.outOfStockProducts)} products have no stock in any warehouse.`,
              )}
            </p>
          </div>
          <LinkButton secondary href="/stocks">
            {t("Stokları incele", "Review stock")}
          </LinkButton>
        </section>
      )}
      <AdminOnly>
        <section className="panel p-6">
          <h2 className="mb-5 text-lg font-semibold">
            {t("Kurulum adımları", "Workspace setup")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                done: data.products > 0,
                href: "/products/new",
                title: t("İlk ürünü ekle", "Add your first product"),
              },
              {
                done: data.warehouses > 0,
                href: "/warehouses/new",
                title: t("İlk depoyu ekle", "Add your first warehouse"),
              },
              {
                done: data.publishedDocuments > 0,
                href: "/knowledge/new",
                title: t(
                  "Bir çalışma rehberi paylaş",
                  "Share an operating guide",
                ),
              },
            ].map((step) => (
              <Link
                className="flex items-center gap-3 rounded-lg bg-subtle p-4 text-sm"
                key={step.href}
                href={step.href}
              >
                <CheckCircle2
                  className={step.done ? "text-brand" : "text-muted"}
                  size={20}
                />
                {step.title}
              </Link>
            ))}
          </div>
        </section>
      </AdminOnly>
      <section className="panel space-y-4 p-6">
        <h2 className="text-lg font-semibold">
          {t("Hızlı erişim", "Quick access")}
        </h2>
        <div className="flex flex-wrap gap-3">
          <ActionAccess href="/stocks/increase">
            <LinkButton href="/stocks/increase">
              {t("Stok girişi", "Receive stock")}
            </LinkButton>
          </ActionAccess>
          <ActionAccess href="/stocks/transfer">
            <LinkButton secondary href="/stocks/transfer">
              {t("Depolar arası transfer", "Transfer stock")}
            </LinkButton>
          </ActionAccess>
          <ActionAccess href="/purchase-orders/new">
            <LinkButton secondary href="/purchase-orders/new">
              {t("Satın alma oluştur", "Create purchase order")}
            </LinkButton>
          </ActionAccess>
          <LinkButton secondary href="/knowledge">
            {t("Bilgi kaynakları", "Knowledge resources")}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
