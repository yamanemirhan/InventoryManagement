"use client";
import Link from "next/link";
import { useWarehouseStock } from "../hooks/use-stocks";
import { WarehouseSelect } from "@/features/warehouses/components/warehouse-select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedWarehouseId } from "@/store/slices/inventory-ui-slice";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { messages as m, formatNumber } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
export function WarehouseStockViewer({ id }: { id?: string }) {
  const selected =
    useAppSelector((s) => s.inventoryUi.selectedWarehouseId) ?? "";
  const dispatch = useAppDispatch();
  const warehouseId = id ?? selected;
  const query = useWarehouseStock(warehouseId);
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
      {!warehouseId ? (
        <EmptyState
          title={m.stocks.choose}
          description={m.stocks.chooseDescription}
        />
      ) : query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          message={getErrorMessage(query.error)}
          onRetry={() => query.refetch()}
        />
      ) : !query.data.length ? (
        <EmptyState
          title={m.stocks.empty}
          description={m.stocks.emptyDescription}
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
              {query.data.map((item) => (
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
