"use client";
import { useCompanyText } from "@/features/companies/company-provider";
import { useI18n } from "@/lib/i18n/provider";
import type { PurchaseOrderStatus } from "../types/purchase-order";

const colors = {
  1: "bg-subtle text-muted",
  2: "bg-info-soft text-info",
  3: "bg-success-soft text-success",
  4: "bg-danger-soft text-danger",
  5: "bg-info-soft text-info",
};
export function OrderStatus({ status }: { status: PurchaseOrderStatus }) {
  const { m } = useI18n();
  const t = useCompanyText();
  const labels = {
    1: m.orders.draft,
    2: m.orders.ordered,
    3: m.orders.received,
    4: m.orders.cancelled,
    5: t("Kısmen teslim alındı", "Partially received"),
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${colors[status]}`}
    >
      <span className="size-1 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
