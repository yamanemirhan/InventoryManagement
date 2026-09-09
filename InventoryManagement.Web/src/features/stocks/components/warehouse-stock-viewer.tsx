"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useWarehouseStock, useStockOverview } from "../hooks/use-stocks";
import { WarehouseSelect } from "@/features/warehouses/components/warehouse-select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedWarehouseId } from "@/store/slices/inventory-ui-slice";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useI18n } from "@/lib/i18n/provider";
import { getErrorMessage } from "@/lib/utils";
export function WarehouseStockViewer({ id }: { id?: string }) {
  const { m, formatNumber, locale } = useI18n();

  const selected =
    useAppSelector((s) => s.inventoryUi.selectedWarehouseId) ?? "";
  const dispatch = useAppDispatch();
  const warehouseId = id ?? selected;
  const [search, setSearch] = useState("");
  const warehouseQuery = useWarehouseStock(warehouseId);
  const overviewQuery = useStockOverview(!warehouseId);
  const query = warehouseId ? warehouseQuery : overviewQuery;
  const items =
    query.data?.filter((item) =>
      `${item.productName} ${item.sku}`
        .toLocaleLowerCase(locale)
        .includes(search.toLocaleLowerCase(locale)),
    ) ?? [];
  return (
    <div className="space-y-5">
      {!id && (
        <div className="panel flex flex-wrap items-end gap-4 p-5">
          <div className="w-full max-w-sm">
            <label
              htmlFor="stock-warehouse"
              className="mb-2 block text-xs font-medium text-muted"
            >
              {m.common.warehouse}
            </label>
            <WarehouseSelect
              emptyLabel={m.stockOverview.all}
              id="stock-warehouse"
              value={selected}
              onChange={(e) =>
                dispatch(setSelectedWarehouseId(e.target.value || null))
              }
            />
          </div>
          {warehouseId && (
            <Link
              className="py-3 text-xs font-medium text-brand"
              href={`/warehouses/${warehouseId}/history`}
            >
              {m.stocks.history} →
            </Link>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          className="field max-w-sm"
          aria-label={m.stockOverview.search}
          placeholder={m.stockOverview.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          variant="secondary"
          disabled={query.isFetching}
          onClick={() => query.refetch()}
        >
          {m.stockOverview.refresh}
        </Button>
        <span role="status" className="text-xs text-muted">
          {m.stockOverview.live}
        </span>
      </div>
      {query.data && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [
              m.stockOverview.total,
              query.data.reduce((total, item) => total + item.quantity, 0),
            ],
            [
              m.stockOverview.products,
              query.data.filter((item) => item.quantity > 0).length,
            ],
            [
              m.stockOverview.zero,
              query.data.filter((item) => item.quantity === 0).length,
            ],
          ].map(([label, value]) => (
            <div key={label} className="panel p-5">
              <p className="text-xs text-muted">{label}</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums">
                {formatNumber(Number(value))}
              </p>
            </div>
          ))}
        </div>
      )}
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          message={getErrorMessage(query.error)}
          onRetry={() => query.refetch()}
        />
      ) : !items.length ? (
        <EmptyState
          title={search ? m.common.emptySearch : m.stocks.empty}
          description={search ? m.common.searchHint : m.stocks.emptyDescription}
        />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{m.common.product}</th>
                <th>{m.common.sku}</th>
                <th className="text-right">{m.stocks.available}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.productId}>
                  <td>
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium hover:text-brand"
                    >
                      {item.productName}
                    </Link>
                  </td>
                  <td className="font-mono text-xs text-muted">{item.sku}</td>
                  <td className="text-right font-semibold tabular-nums">
                    {formatNumber(item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
