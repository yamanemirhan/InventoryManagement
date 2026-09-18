"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import {
  useCompany,
  useCompanyText,
} from "@/features/companies/company-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { exportRows, type FileCell } from "./files";
export type StockRow = {
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  minimumQuantity: number;
  version: number;
};
type ReportRow = StockRow & {
  id: string;
  relatedWarehouseName?: string;
  type: number;
  signedDelta?: number;
  reason?: string;
  purchaseOrderId?: string;
  createdAtUtc: string;
  previousQuantity: number;
  countedQuantity: number;
};
export type Page<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};
export function LowStockAlert() {
  const t = useCompanyText();
  const { company } = useCompany();
  const query = useQuery({
    queryKey: ["low-stock", company?.id],
    enabled: !!company,
    queryFn: () =>
      apiClient<Page<StockRow>>("/api/reports/stocks?lowOnly=true&pageSize=5"),
    refetchInterval: 60000,
  });
  if (query.error)
    return (
      <p role="status" className="text-sm text-muted">
        {t(
          "Minimum stok uyarıları alınamadı.",
          "Low-stock alerts unavailable.",
        )}{" "}
        <button className="underline" onClick={() => void query.refetch()}>
          {t("Tekrar dene", "Retry")}
        </button>
      </p>
    );
  if (!query.data?.totalCount) return null;
  return (
    <section className="panel space-y-2 border-warning p-5" role="status">
      <h2 className="font-semibold">
        {t("Minimum stok uyarısı", "Low stock alert")} · {query.data.totalCount}
      </h2>
      <ul className="space-y-1 text-sm">
        {query.data.items.map((r) => (
          <li key={r.productId + r.warehouseId}>
            {r.productName} · {r.warehouseName}:{" "}
            <strong>
              {r.quantity} / {r.minimumQuantity}
            </strong>
          </li>
        ))}
      </ul>
      <Link className="text-sm text-brand underline" href="/reports">
        {t("Stok raporunu aç", "Open inventory report")}
      </Link>
    </section>
  );
}
function StockEditor({ row, onClose }: { row: StockRow; onClose: () => void }) {
  const t = useCompanyText(),
    cache = useQueryClient();
  const [kind, setKind] = useState("count"),
    [quantity, setQuantity] = useState(String(row.quantity)),
    [minimum, setMinimum] = useState(String(row.minimumQuantity)),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiClient(
        kind === "count" ? "/api/stocks/count" : "/api/stocks/minimum",
        {
          method: kind === "count" ? "POST" : "PUT",
          body: {
            productId: row.productId,
            warehouseId: row.warehouseId,
            expectedVersion: row.version,
            ...(kind === "count"
              ? { quantity: Number(quantity), reason }
              : { minimumQuantity: Number(minimum) }),
          },
        },
      );
      await cache.invalidateQueries();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel space-y-4 border-brand p-5">
      <h2 className="font-semibold">
        {row.productName} · {row.warehouseName}
      </h2>
      <p className="text-sm text-muted">
        {t("Kayıtlı miktar", "Recorded quantity")}: {row.quantity}
      </p>
      <form onSubmit={save} className="space-y-4">
        <fieldset disabled={busy} className="space-y-3">
          <label className="block text-sm">
            {t("İşlem", "Operation")}
            <select
              className="field mt-1"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="count">
                {t("Fiziksel sayım", "Physical count")}
              </option>
              <option value="minimum">
                {t("Minimum stok", "Minimum stock")}
              </option>
            </select>
          </label>
          <label className="block text-sm">
            {kind === "count"
              ? t("Sayılan miktar", "Counted quantity")
              : t("Minimum miktar", "Minimum quantity")}
            <Input
              type="number"
              min={0}
              max={2147483647}
              step={1}
              required
              value={kind === "count" ? quantity : minimum}
              onChange={(e) =>
                kind === "count"
                  ? setQuantity(e.target.value)
                  : setMinimum(e.target.value)
              }
            />
          </label>
          {kind === "count" && (
            <>
              <p className="text-sm">
                {t("Stok farkı", "Stock adjustment")}:{" "}
                {Number(quantity) - row.quantity}
              </p>
              <label className="block text-sm">
                {t("Sayım / düzeltme gerekçesi", "Count / adjustment reason")}
                <Input
                  required
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
            </>
          )}
          <div className="flex gap-2">
            <Button>{t("Kaydet", "Save")}</Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("Vazgeç", "Cancel")}
            </Button>
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-danger">
            {error}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => {
                void cache.invalidateQueries();
                onClose();
              }}
            >
              {t("Güncel veriyi yükle", "Reload current data")}
            </button>
          </p>
        )}
      </form>
    </section>
  );
}
export function ReportsPage() {
  const t = useCompanyText();
  const { company } = useCompany();
  const manage = !!company && ["Owner", "Manager"].includes(company.role);
  const [kind, setKind] = useState("stocks"),
    [warehouse, setWarehouse] = useState(""),
    [search, setSearch] = useState(""),
    [low, setLow] = useState(false),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<StockRow | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const warehouses = useQuery({
    queryKey: ["report-warehouses", company?.id],
    queryFn: () => apiClient<{ id: string; name: string }[]>("/api/warehouses"),
  });
  function url(pageNumber = page, pageSize = 50) {
    const p = new URLSearchParams({
      page: String(pageNumber),
      pageSize: String(pageSize),
      search,
    });
    if (warehouse) p.set("warehouseId", warehouse);
    if (kind === "stocks") p.set("lowOnly", String(low));
    else {
      if (from) p.set("from", new Date(from + "T00:00:00Z").toISOString());
      if (to) {
        const end = new Date(to + "T00:00:00Z");
        end.setUTCDate(end.getUTCDate() + 1);
        p.set("to", end.toISOString());
      }
    }
    return "/api/reports/" + kind + "?" + p;
  }
  const query = useQuery({
    queryKey: [
      "inventory-report",
      company?.id,
      kind,
      warehouse,
      search,
      low,
      from,
      to,
      page,
    ],
    queryFn: () => apiClient<Page<ReportRow>>(url()),
  });
  const headers =
    kind === "stocks"
      ? [
          t("Ürün", "Product"),
          "SKU",
          t("Depo", "Warehouse"),
          t("Miktar", "Quantity"),
          t("Minimum", "Minimum"),
        ]
      : kind === "counts"
        ? [
            t("Tarih", "Date"),
            t("Ürün", "Product"),
            "SKU",
            t("Depo", "Warehouse"),
            t("Önce", "Before"),
            t("Sayım", "Counted"),
            t("Gerekçe", "Reason"),
          ]
        : [
            t("Tarih", "Date"),
            t("Ürün", "Product"),
            "SKU",
            t("Depo", "Warehouse"),
            t("Hedef depo", "Related warehouse"),
            t("Tür", "Type"),
            t("Miktar", "Quantity"),
            t("Fark", "Delta"),
            t("Gerekçe", "Reason"),
            t("Sipariş", "Order"),
          ];
  const rowValues = (r: ReportRow): FileCell[] =>
    kind === "stocks"
      ? [r.productName, r.sku, r.warehouseName, r.quantity, r.minimumQuantity]
      : kind === "counts"
        ? [
            r.createdAtUtc,
            r.productName,
            r.sku,
            r.warehouseName,
            r.previousQuantity,
            r.countedQuantity,
            r.reason,
          ]
        : [
            r.createdAtUtc,
            r.productName,
            r.sku,
            r.warehouseName,
            r.relatedWarehouseName,
            (
              {
                1: t("Giriş", "In"),
                2: t("Çıkış", "Out"),
                3: t("Transfer", "Transfer"),
                4: t("Düzeltme", "Adjustment"),
              } as Record<number, string>
            )[r.type],
            r.quantity,
            r.signedDelta,
            r.reason,
            r.purchaseOrderId,
          ];
  async function exportFile(format: "csv" | "xlsx") {
    setBusy(true);
    setError("");
    try {
      const first = await apiClient<Page<ReportRow>>(url(1, 1000));
      if (first.totalCount > 5000)
        throw new Error(
          t(
            "Dışa aktarmak için filtreyi 5000 satırın altına daraltın.",
            "Narrow the filters to at most 5000 rows before exporting.",
          ),
        );
      const rows = [...first.items];
      for (let i = 2; i <= Math.ceil(first.totalCount / 1000); i++)
        rows.push(...(await apiClient<Page<ReportRow>>(url(i, 1000))).items);
      await exportRows(
        "inventory-" + kind,
        headers,
        rows.map(rowValues),
        format,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  function filters(action: () => void) {
    action();
    setPage(1);
    setSelected(null);
  }
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">
          {t("Envanter raporları", "Inventory reports")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {t(
            "Depoya göre sayım, minimum stok ve hareket geçmişi. Aktarımlar seçili filtreleri kullanır.",
            "Count by warehouse, manage thresholds and review movements. Exports use the selected filters.",
          )}
        </p>
      </div>
      <LowStockAlert />
      <section className="panel space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            {t("Rapor", "Report")}
            <select
              className="field"
              value={kind}
              onChange={(e) => filters(() => setKind(e.target.value))}
            >
              <option value="stocks">
                {t("Stok ve minimumlar", "Stock and thresholds")}
              </option>
              <option value="movements">
                {t("Stok hareketleri", "Stock movements")}
              </option>
              <option value="counts">
                {t("Sayım geçmişi", "Count history")}
              </option>
            </select>
          </label>
          <label className="text-sm">
            {t("Depo", "Warehouse")}
            <select
              className="field"
              value={warehouse}
              onChange={(e) => filters(() => setWarehouse(e.target.value))}
            >
              <option value="">{t("Tüm depolar", "All warehouses")}</option>
              {warehouses.data?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t("Ürün / SKU ara", "Search product / SKU")}
            <Input
              maxLength={200}
              value={search}
              onChange={(e) => filters(() => setSearch(e.target.value))}
            />
          </label>
        </div>
        {warehouses.error && <p role="alert">{warehouses.error.message}</p>}
        {kind === "stocks" ? (
          <>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={low}
                onChange={(e) => filters(() => setLow(e.target.checked))}
              />
              {t("Yalnızca minimumun altı", "Below minimum only")}
            </label>
            <p className="text-xs text-muted">
              {t(
                "Henüz stok kaydı olmayan ürünleri saymak için bir depo seçin. Minimum 0, uyarıyı kapatır.",
                "Select a warehouse to count products without a stock record. Minimum 0 disables its alert.",
              )}
            </p>
          </>
        ) : (
          <div className="flex gap-3">
            <label className="text-sm">
              {t("Başlangıç (UTC)", "From (UTC)")}
              <Input
                type="date"
                value={from}
                onChange={(e) => filters(() => setFrom(e.target.value))}
              />
            </label>
            <label className="text-sm">
              {t("Bitiş dahil (UTC)", "Through (UTC)")}
              <Input
                type="date"
                value={to}
                min={from}
                onChange={(e) => filters(() => setTo(e.target.value))}
              />
            </label>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={busy || !query.data?.totalCount}
            onClick={() => void exportFile("csv")}
          >
            CSV
          </Button>
          <Button
            variant="secondary"
            disabled={busy || !query.data?.totalCount}
            onClick={() => void exportFile("xlsx")}
          >
            Excel
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
      </section>
      {selected && (
        <StockEditor
          key={selected.productId + selected.warehouseId + selected.version}
          row={selected}
          onClose={() => setSelected(null)}
        />
      )}{" "}
      {query.isPending ? (
        <LoadingState />
      ) : query.error ? (
        <ErrorState
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                  {kind === "stocks" && manage && (
                    <th>{t("İşlem", "Action")}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((r) => (
                  <tr
                    key={r.id ?? r.productId + r.warehouseId}
                    className={
                      kind === "stocks" && r.minimumQuantity > r.quantity
                        ? "bg-warning-soft"
                        : ""
                    }
                  >
                    {rowValues(r).map((v, i) => (
                      <td key={i}>{String(v ?? "—")}</td>
                    ))}
                    {kind === "stocks" && manage && (
                      <td>
                        <Button
                          variant="secondary"
                          onClick={() => setSelected({ ...r })}
                        >
                          {t("Sayım / minimum", "Count / threshold")}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!query.data.totalCount && (
            <p className="p-5 text-sm text-muted">
              {t("Bu filtrede kayıt yok.", "No records match these filters.")}
            </p>
          )}
          <div className="flex items-center justify-between gap-3 p-4">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("Önceki", "Previous")}
            </Button>
            <span className="text-sm">
              {page} / {Math.max(1, Math.ceil(query.data.totalCount / 50))} ·{" "}
              {query.data.totalCount}
            </span>
            <Button
              variant="secondary"
              disabled={page * 50 >= query.data.totalCount}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("Sonraki", "Next")}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
