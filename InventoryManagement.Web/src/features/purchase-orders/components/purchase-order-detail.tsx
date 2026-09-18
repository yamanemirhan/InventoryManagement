"use client";
import { Fulfillment } from "@/features/operations/fulfillment";
import { AdminOnly } from "@/features/auth/components/access";
import Link from "next/link";
import { useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { usePurchaseOrder, useOrderAction } from "../hooks/use-purchase-orders";
import type { OrderAction } from "../types/purchase-order";
import { OrderStatus } from "./order-status";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useI18n } from "@/lib/i18n/provider";
import { getErrorMessage } from "@/lib/utils";
import { ApiError } from "@/lib/api/api-error";
export function PurchaseOrderDetail({ id }: { id: string }) {
  const { m, formatAmount, formatNumber, formatDate } = useI18n();

  const query = usePurchaseOrder(id);
  const mutation = useOrderAction();
  const [action, setAction] = useState<OrderAction | null>(null);
  const actionButton = useRef<HTMLButtonElement | null>(null);
  const close = () => {
    setAction(null);
    actionButton.current?.focus();
  };
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return (
      <ErrorState
        message={getErrorMessage(query.error)}
        onRetry={() => query.refetch()}
      />
    );
  const order = query.data;
  const submit = async () => {
    if (!action || mutation.isPending) return;
    try {
      await mutation.mutateAsync({
        id,
        action,
        warehouseId: order.warehouseId,
      });
    } catch {
    } finally {
      close();
    }
  };
  const descriptions = {
    order: m.orders.confirmOrder,
    receive: m.orders.confirmReceive,
    cancel: m.orders.confirmCancel,
  };
  return (
    <div className="space-y-5">
      {mutation.isError && (
        <Alert title={m.common.formError} tone="error">
          {mutation.error instanceof ApiError &&
          mutation.error.isConcurrencyConflict
            ? m.common.conflict
            : getErrorMessage(mutation.error)}
        </Alert>
      )}
      {mutation.isSuccess && <Alert title={m.orders.success} tone="success" />}
      <section className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-lg font-semibold">
              PO-{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="mt-2 text-xs text-muted">
              {formatDate(order.createdAtUtc)}
            </p>
          </div>
          <OrderStatus status={order.status} />
        </div>
        <dl className="mt-7 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">{m.common.supplier}</dt>
            <dd className="mt-2 text-sm font-medium">
              <Link href={`/suppliers/${order.supplierId}`}>
                {order.supplierName}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{m.common.warehouse}</dt>
            <dd className="mt-2 text-sm font-medium">
              <Link href={`/warehouses/${order.warehouseId}`}>
                {order.warehouseName}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{m.orders.total}</dt>
            <dd className="mt-2 text-xl font-semibold tabular-nums">
              {formatAmount(order.totalAmount)}
            </dd>
          </div>
        </dl>
      </section>
      {order.status !== 4 && (
        <ol
          aria-label={m.orders.lifecycle}
          className="flex flex-wrap items-center gap-3 px-2"
        >
          {[m.orders.draft, m.orders.ordered, m.orders.received].map(
            (label, i) => (
              <li
                key={label}
                className={`flex items-center gap-2 text-xs ${(order.status === 5 ? 2 : order.status) >= i + 1 ? "text-brand" : "text-muted"}`}
              >
                <span
                  className={`grid size-6 place-items-center rounded-full ${(order.status === 5 ? 2 : order.status) >= i + 1 ? "bg-brand-soft" : "bg-subtle"}`}
                >
                  {(order.status === 5 ? 2 : order.status) > i + 1 ? (
                    <Check className="size-3" />
                  ) : (
                    i + 1
                  )}
                </span>
                {label}
                {i < 2 && <ChevronRight className="ml-2 size-3 text-muted" />}
              </li>
            ),
          )}
        </ol>
      )}
      <section className="panel overflow-hidden">
        <h2 className="border-b border-line p-6 text-sm font-semibold">
          {m.orders.items}
        </h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{m.common.product}</th>
                <th>{m.common.quantity}</th>
                <th className="text-right">{m.orders.unitPrice}</th>
                <th className="text-right">{m.orders.lineTotal}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td>
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {item.sku}
                    </p>
                  </td>
                  <td>{formatNumber(item.quantity)}</td>
                  <td className="text-right tabular-nums">
                    {formatAmount(item.unitPrice)}
                  </td>
                  <td className="text-right font-medium tabular-nums">
                    {formatAmount(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-10 border-t border-line bg-subtle p-6 text-sm">
          <span>{m.orders.total}</span>
          <strong className="tabular-nums">
            {formatAmount(order.totalAmount)}
          </strong>
        </div>
      </section>
      <p className="text-xs leading-6 text-muted">{m.orders.priceNote}</p>
      <AdminOnly>
        <Fulfillment key={order.version} order={order} />
        <section className="panel p-6">
          <p className="mb-5 text-sm text-muted">{m.orders.receiptNote}</p>
          <div className="flex flex-wrap gap-3">
            {(["order", "receive", "cancel"] as const).map((value) => (
              <Button
                key={value}
                variant={value === "cancel" ? "secondary" : "primary"}
                disabled={
                  mutation.isPending ||
                  (value === "order"
                    ? order.status !== 1
                    : value === "receive"
                      ? order.status !== 2 && order.status !== 5
                      : order.status !== 1 && order.status !== 2)
                }
                onClick={(event) => {
                  actionButton.current = event.currentTarget;
                  mutation.reset();
                  setAction(value);
                }}
              >
                {m.orders[value]}
              </Button>
            ))}
          </div>
        </section>
      </AdminOnly>
      {action && (
        <ConfirmDialog
          description={descriptions[action]}
          pending={mutation.isPending}
          onConfirm={submit}
          onClose={close}
        />
      )}
    </div>
  );
}
