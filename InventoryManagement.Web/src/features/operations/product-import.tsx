"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useCompanyText } from "@/features/companies/company-provider";
import { Button } from "@/components/ui/button";
import { exportRows, readProducts } from "./files";
type Row = { name: string; sku: string };
export function ProductImport() {
  const t = useCompanyText(),
    cache = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]),
    [errors, setErrors] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [validated, setValidated] = useState(false),
    [notice, setNotice] = useState("");
  async function choose(file?: File) {
    setValidated(false);
    setRows([]);
    setErrors([]);
    setNotice("");
    if (!file) return;
    setBusy(true);
    try {
      const data = await readProducts(file);
      const preview = await apiClient<{ rowCount: number; errors: string[] }>(
        "/api/products/import/preview",
        { method: "POST", body: { rows: data } },
      );
      setRows(data);
      setErrors(preview.errors);
      setValidated(preview.errors.length === 0);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Error"]);
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    setBusy(true);
    setNotice("");
    try {
      const count = await apiClient<number>("/api/products/import", {
        method: "POST",
        body: { rows },
      });
      setRows([]);
      setNotice(t(`${count} ürün eklendi.`, `${count} products imported.`));
      await cache.invalidateQueries();
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Error"]);
    } finally {
      setBusy(false);
    }
  }
  async function file(action: () => Promise<void>) {
    setBusy(true);
    setErrors([]);
    try {
      await action();
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Error"]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel space-y-4 p-5">
      <h2 className="font-semibold">
        {t("Ürün aktarımı", "Product import & export")}
      </h2>
      <p className="text-sm text-muted">
        {t(
          "Name ve Sku sütunlarıyla en fazla 1000 yeni ürün, 1 MB CSV/XLSX. Mevcut SKU'lar güncellenmez; hatalı dosya kısmen kaydedilmez.",
          "Up to 1000 new products, 1 MB CSV/XLSX with Name and Sku columns. Existing SKUs are not overwritten; invalid files are not partially imported.",
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() =>
            void file(() =>
              exportRows(
                "products-template",
                ["Name", "Sku"],
                [["Example product", "EXAMPLE-001"]],
                "xlsx",
              ),
            )
          }
        >
          {t("Excel şablonu", "Excel template")}
        </Button>
        {(["csv", "xlsx"] as const).map((format) => (
          <Button
            key={format}
            variant="secondary"
            disabled={busy}
            onClick={() =>
              void file(async () => {
                const data = await apiClient<Row[]>("/api/products");
                if (data.length > 5000)
                  throw new Error(
                    t(
                      "Dışa aktarma sınırı 5000 üründür.",
                      "Export limit is 5000 products.",
                    ),
                  );
                await exportRows(
                  "products",
                  ["Name", "Sku"],
                  data.map((r) => [r.name, r.sku]),
                  format,
                );
              })
            }
          >
            {t("Ürünleri dışa aktar", "Export products")} ·{" "}
            {format.toUpperCase()}
          </Button>
        ))}
      </div>
      <label className="block text-sm">
        {t("Aktarılacak dosya", "File to import")}
        <input
          className="field mt-2"
          type="file"
          accept=".csv,.xlsx"
          disabled={busy}
          onChange={(e) => void choose(e.target.files?.[0])}
        />
      </label>
      {busy && <p role="status">{t("İşleniyor…", "Processing…")}</p>}
      {errors.length > 0 && (
        <ul role="alert" className="max-h-48 overflow-auto text-sm text-danger">
          {errors.slice(0, 30).map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      {rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm">
            {t("Önizleme", "Preview")}: {rows.length} ·{" "}
            {t("İlk 10 satır", "First 10 rows")}
          </p>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Sku</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td>{r.sku}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            disabled={busy || errors.length > 0 || !validated}
            onClick={() => void commit()}
          >
            {t("Doğrulanan ürünleri içe aktar", "Import validated products")}
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="text-success">
          {notice}
        </p>
      )}
    </section>
  );
}
