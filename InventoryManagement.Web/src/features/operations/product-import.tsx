"use client";
import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useCompanyText } from "@/features/companies/company-provider";
import { Button } from "@/components/ui/button";
import { exportRows } from "./files";
import { BulkImport } from "./bulk-import";
import type { ProductDto } from "@/features/products/types/product";

export function ProductImport() {
  const t = useCompanyText();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function download(format: "csv" | "xlsx") {
    setBusy(true); setError("");
    try {
      const data = await apiClient<ProductDto[]>("/api/products");
      if (data.length > 5000) throw new Error(t("Dışa aktarma sınırı 5000 üründür.", "Export limit is 5000 products."));
      await exportRows("products", ["Name", "Sku", "Barcode"], data.map(r => [r.name, r.sku, r.barcode ?? ""]), format);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4">
    <BulkImport initialKind="products" selectable={false} />
    <div className="panel space-y-3 p-5">
      <div className="flex flex-wrap gap-2">{(["csv", "xlsx"] as const).map(format => <Button type="button" key={format} variant="secondary" disabled={busy} onClick={() => { void download(format); }}>{t("Ürünleri dışa aktar", "Export products")} · {format.toUpperCase()}</Button>)}</div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  </div>;
}
