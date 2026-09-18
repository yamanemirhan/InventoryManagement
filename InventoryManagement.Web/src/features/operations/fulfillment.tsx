"use client";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useCompanyText } from "@/features/companies/company-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PurchaseOrderDto } from "@/features/purchase-orders/types/purchase-order";
export function Fulfillment({ order }: { order: PurchaseOrderDto }) {
  const t = useCompanyText(),
    cache = useQueryClient();
  const [isReturn, setReturn] = useState(false),
    [quantities, setQuantities] = useState<Record<string, string>>({}),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  const canReceive = order.status === 2 || order.status === 5,
    canReturn = order.status === 3 || order.status === 5;
  const returning = isReturn || !canReceive;
  const lines = order.items
    .map((i) => ({
      productId: i.productId,
      quantity: Number(quantities[i.productId] ?? 0),
    }))
    .filter((i) => i.quantity > 0);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiClient(`/api/purchase-orders/${order.id}/fulfillment`, {
        method: "POST",
        body: {
          expectedVersion: order.version,
          isReturn: returning,
          reason,
          lines,
        },
      });
      await cache.invalidateQueries();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  if (!canReceive && !canReturn) return null;
  return (
    <section className="panel space-y-4 p-6">
      <h2 className="font-semibold">
        {t("Kısmi teslim alma ve iade", "Partial receipt & supplier return")}
      </h2>
      <form onSubmit={save} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <label className="block text-sm">
            {t("İşlem", "Operation")}
            <select
              className="field"
              value={returning ? "return" : "receive"}
              onChange={(e) => {
                setReturn(e.target.value === "return");
                setQuantities({});
                setConfirm(false);
              }}
            >
              {canReceive && (
                <option value="receive">
                  {t("Teslim al", "Receive goods")}
                </option>
              )}
              {canReturn && (
                <option value="return">
                  {t("Tedarikçiye iade", "Return to supplier")}
                </option>
              )}
            </select>
          </label>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("Ürün", "Product")}</th>
                  <th>{t("Sipariş", "Ordered")}</th>
                  <th>{t("Alınan", "Received")}</th>
                  <th>{t("İade", "Returned")}</th>
                  <th>{t("Bu işlem", "This operation")}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i) => {
                  const max = returning
                    ? i.receivedQuantity - i.returnedQuantity
                    : i.quantity - i.receivedQuantity;
                  return (
                    <tr key={i.productId}>
                      <td>
                        {i.productName}
                        <p className="text-xs text-muted">{i.sku}</p>
                      </td>
                      <td>{i.quantity}</td>
                      <td>{i.receivedQuantity}</td>
                      <td>{i.returnedQuantity}</td>
                      <td>
                        <Input
                          aria-label={
                            i.productName + " " + t("miktar", "quantity")
                          }
                          className="w-28"
                          type="number"
                          min={0}
                          max={max}
                          step={1}
                          disabled={max === 0}
                          value={quantities[i.productId] ?? ""}
                          placeholder="0"
                          onChange={(e) => {
                            setQuantities((q) => ({
                              ...q,
                              [i.productId]: e.target.value,
                            }));
                            setConfirm(false);
                          }}
                        />
                        <p className="mt-1 text-xs text-muted">
                          {t("En fazla", "Maximum")}: {max}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <label className="block text-sm">
            {t("Gerekçe / teslimat referansı", "Reason / delivery reference")}
            <Input
              required
              maxLength={500}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setConfirm(false);
              }}
            />
          </label>
          <p className="text-xs text-muted">
            {t(
              "İadeler stoktan düşülür; siparişin teslim alınan miktarı korunur. İadeden sonra yeni mal almak için yeni sipariş oluşturun.",
              "Returns reduce stock and retain the receipt history. Use a new order for replacements after a return.",
            )}
          </p>
          {confirm && (
            <p role="status" className="font-medium">
              {t(
                "Seçilen miktarlar stokları değiştirecek. Onaylıyor musunuz?",
                "Selected quantities will change stock. Confirm?",
              )}
            </p>
          )}
          <div className="flex gap-2">
            <Button disabled={!lines.length || !reason.trim()}>
              {confirm
                ? t("Onayla ve kaydet", "Confirm and save")
                : t("İşlemi gözden geçir", "Review operation")}
            </Button>
            {confirm && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirm(false)}
              >
                {t("Vazgeç", "Cancel")}
              </Button>
            )}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-danger">
            {error}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void cache.invalidateQueries()}
            >
              {t("Yenile", "Reload")}
            </button>
          </p>
        )}
      </form>
    </section>
  );
}
