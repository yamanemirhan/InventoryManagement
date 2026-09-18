"use client";
import Link from "next/link";
import { useState } from "react";
import { usePurchaseOrders } from "../hooks/use-purchase-orders";
import { OrderStatus } from "./order-status";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { useI18n } from "@/lib/i18n/provider";
import { getErrorMessage } from "@/lib/utils";
export function PurchaseOrdersList() {
  const { m, formatAmount, formatDate } = useI18n();

  const [page, setPage] = useState(1);
  const query = usePurchaseOrders(page);
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return (
      <ErrorState
        message={getErrorMessage(query.error)}
        onRetry={() => query.refetch()}
      />
    );
  if (!query.data.totalCount)
    return (
      <EmptyState
        title={m.orders.empty}
        description={m.orders.emptyDescription}
      />
    );
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{m.orders.number}</th>
              <th>{m.common.supplier}</th>
              <th>{m.common.warehouse}</th>
              <th>{m.orders.status}</th>
              <th className="text-right">{m.orders.total}</th>
            </tr>
          </thead>
          <tbody>
            {query.data.items.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link
                    href={`/purchase-orders/${o.id}`}
                    className="font-mono text-xs font-semibold text-brand"
                  >
                    PO-{o.id.slice(0, 8).toUpperCase()}
                  </Link>
                  <p className="mt-1 text-[11px] text-muted">
                    {formatDate(o.createdAtUtc)}
                  </p>
                </td>
                <td className="font-medium">{o.supplierName}</td>
                <td className="text-muted">{o.warehouseName}</td>
                <td>
                  <OrderStatus status={o.status} />
                </td>
                <td className="text-right font-medium tabular-nums">
                  {formatAmount(o.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={query.data.pageSize}
        total={query.data.totalCount}
        onChange={setPage}
      />
    </div>
  );
}
