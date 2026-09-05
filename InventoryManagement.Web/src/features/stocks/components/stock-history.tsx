"use client";
import { useState } from "react";
import Link from "next/link";
import { useStockHistory } from "../hooks/use-stocks";
import { useWarehouses } from "@/features/warehouses/hooks/use-warehouses";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { messages as m, formatNumber, formatDate } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
export function StockHistory({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const query = useStockHistory(id, page);
  const warehouses = useWarehouses();
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
        title={m.stocks.noHistory}
        description={m.stocks.noHistoryDescription}
      />
    );
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{m.common.date}</th>
              <th>{m.common.product}</th>
              <th>{m.stocks.type}</th>
              <th>{m.common.quantity}</th>
              <th>{m.stocks.related}</th>
            </tr>
          </thead>
          <tbody>
            {query.data.items.map((item) => {
              const incoming =
                item.type === 1 ||
                (item.type === 3 && item.relatedWarehouseId === id);
              const related =
                item.warehouseId === id
                  ? item.relatedWarehouseId
                  : item.warehouseId;
              const label =
                item.type === 3
                  ? incoming
                    ? m.stocks.transferIn
                    : m.stocks.transferOut
                  : item.type === 1
                    ? m.stocks.incoming
                    : item.type === 2
                      ? m.stocks.outgoing
                      : m.stocks.adjustment;
              return (
                <tr key={item.id}>
                  <td className="text-xs text-muted">
                    {formatDate(item.createdAtUtc)}
                  </td>
                  <td>
                    <Link
                      className="font-medium hover:text-brand"
                      href={`/products/${item.productId}`}
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {item.sku}
                    </p>
                  </td>
                  <td>
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${incoming ? "bg-success-soft text-success" : "bg-info-soft text-info"}`}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="font-medium tabular-nums">
                    {incoming
                      ? "+"
                      : item.type === 2 || item.type === 3
                        ? "−"
                        : ""}
                    {formatNumber(item.quantity)}
                  </td>
                  <td className="text-xs text-muted">
                    {related ? (
                      <Link href={`/warehouses/${related}`}>
                        {warehouses.data?.find((w) => w.id === related)?.name ??
                          related}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
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
