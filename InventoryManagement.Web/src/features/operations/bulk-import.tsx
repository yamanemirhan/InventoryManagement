"use client";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCompany, useCompanyText } from "@/features/companies/company-provider";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { exportRows, readImportRows } from "./files";

export type ImportKind = "products" | "warehouses" | "suppliers" | "stocks" | "purchase-orders";
const definitions: Record<ImportKind, { tr: string; en: string; headers: string[]; example: string[][] }> = {
  products: { tr: "Ürünler", en: "Products", headers: ["Name", "Sku", "Barcode"], example: [["Example product", "EXAMPLE-001", "0012345678905"]] },
  warehouses: { tr: "Depolar", en: "Warehouses", headers: ["Name", "Location"], example: [["Main warehouse", "Istanbul"]] },
  suppliers: { tr: "Tedarikçiler", en: "Suppliers", headers: ["Name", "Email"], example: [["Example supplier", "supplier@example.com"]] },
  stocks: { tr: "Başlangıç stokları", en: "Opening stock", headers: ["Sku", "WarehouseName", "Quantity", "MinimumQuantity"], example: [["EXAMPLE-001", "Main warehouse", "10", "3"]] },
  "purchase-orders": { tr: "Taslak satın alma siparişleri", en: "Draft purchase orders", headers: ["OrderKey", "SupplierEmail", "WarehouseName", "Sku", "Quantity", "UnitPrice"], example: [["PO-001", "supplier@example.com", "Main warehouse", "EXAMPLE-001", "10", "25.50"]] },
};
type Row = Record<string, string>;
type RowError = { row: number; column: string; message: string };
type Preview = { rowCount: number; errors: RowError[]; alreadyImported: boolean };
export function BulkImport({ initialKind = "products", selectable = true }: { initialKind?: ImportKind; selectable?: boolean }) {
  const t = useCompanyText(), { company } = useCompany(), cache = useQueryClient();
  const [kind, setKind] = useState<ImportKind>(initialKind);
  const [rows, setRows] = useState<Row[]>([]), [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // Include the company in the workspace identity; never submit a preview from another company.
  const [previewCompanyId, setPreviewCompanyId] = useState("");
  const definition = definitions[kind];
  const accessible = !!company && ["Owner", "Manager"].includes(company.role);
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }
  function reset() { setRows([]); setPreview(null); setPreviewCompanyId(""); setError(""); setNotice(""); if (fileInput.current) fileInput.current.value = ""; }
  async function choose(file?: File) {
    reset(); if (!file || !company) return;
    const companyId = company.id;
    await run(async () => {
      const parsed = await readImportRows(file, definition.headers, kind === "products" ? ["Barcode"] : []);
      // JSON (not the uploaded file) reaches the API, so also bound its UTF-8 body size.
      if (new TextEncoder().encode(JSON.stringify({ kind, rows: parsed })).length > 1_048_576) throw new Error(t("İstek sınırı 1 MB. Dosyayı bölün.", "Request limit is 1 MB. Split the file."));
      const result = await apiClient<Preview>("/api/imports/preview", { method: "POST", body: { kind, rows: parsed } });
      setRows(parsed); setPreview(result); setPreviewCompanyId(companyId);
    });
  }
  async function commit() {
    if (!preview || previewCompanyId !== company?.id || preview.errors.length || preview.alreadyImported) return;
    await run(async () => {
      const result = await apiClient<{ records: number; alreadyImported: boolean }>("/api/imports", { method: "POST", body: { kind, rows } });
      reset(); setNotice(result.alreadyImported ? t("Bu dosya daha önce aktarıldı; tekrar eklenmedi.", "This file was already imported; no duplicates were added.") : t(`${result.records} kayıt eklendi.`, `${result.records} records added.`));
      await cache.invalidateQueries();
    });
  }
  if (!accessible) return <p role="alert">{t("Toplu aktarım için şirket sahibi veya yönetici olmalısınız.", "Bulk import requires a company Owner or Manager.")}</p>;
  const currentPreview = previewCompanyId === company.id ? preview : null;
  return <section className="panel space-y-5 p-5">
    <h2 className="text-lg font-semibold">{t("Toplu veri aktarımı", "Bulk data import")}</h2>
    <p className="text-sm text-muted">{t("1. Şablonu indirin. 2. Örnek satırı kendi verilerinizle değiştirin. 3. Dosyayı yükleyip kontrol edin. 4. Doğrulanan kayıtları ekleyin. Her dosya en fazla 1000 satır / 1 MB; Excel veya CSV.", "1. Download a template. 2. Replace the example row with your data. 3. Upload and review. 4. Import validated records. Up to 1000 rows / 1 MB per file, Excel or CSV.")}</p>
    <p className="text-sm text-muted">{t("Önce ürün/depo/tedarikçileri, sonra stok ve siparişleri aktarın. Mevcut kayıtlar güncellenmez. Herhangi bir hata varsa dosyanın tamamı reddedilir. Aynı içerikli dosya tekrar eklenmez.", "Import products/warehouses/suppliers first, then stock and orders. Existing records are not updated. Any error rejects the entire file. A file with the same contents is not imported twice.")}</p>
    {selectable && <label className="block text-sm">{t("Aktarım türü", "Import type")}<select className="field mt-2" value={kind} disabled={busy} onChange={e => { reset(); setKind(e.target.value as ImportKind); }}>{Object.entries(definitions).map(([k, d]) => <option key={k} value={k}>{t(d.tr, d.en)}</option>)}</select></label>}
    {!selectable && <p className="font-medium">{t(definition.tr, definition.en)}</p>}
    {kind === "products" && <p className="text-sm text-muted">{t("Barcode isteğe bağlıdır. Baştaki sıfırları korumak için metin biçimini kullanın. Eski Name/Sku şablonları da kabul edilir.", "Barcode is optional. Keep it as text to preserve leading zeros. Existing Name/Sku templates are also accepted.")}</p>}
    {kind === "stocks" && <p className="text-sm text-muted">{t("SKU ve depo adı bu şirkette bulunmalıdır. Yalnızca henüz stoğu olmayan ürün/depo eşleşmelerine başlangıç miktarı eklenir. Mevcut stok için sayım veya stok hareketi kullanın. MinimumQuantity = minimum stok.", "SKU and warehouse name must exist in this company. Opening quantities apply only to product/warehouse pairs with no stock record. Use counts or movements for existing stock. MinimumQuantity is the stock threshold.")}</p>}
    {kind === "purchase-orders" && <p className="text-sm text-muted">{t("Aynı OrderKey satırları tek taslak sipariş oluşturur (en fazla 100 ürün). SupplierEmail, WarehouseName ve Sku bu şirkette bulunmalıdır. OrderKey yalnızca dosyadaki gruplama içindir. UnitPrice için nokta kullanın: 25.50. Stok otomatik artırılmaz.", "Rows sharing OrderKey create one draft order (up to 100 products). SupplierEmail, WarehouseName and Sku must exist in this company. OrderKey groups rows within this file. Use a dot for UnitPrice: 25.50. Stock is not automatically increased.")}</p>}
    <div className="flex flex-wrap gap-2">{(["xlsx", "csv"] as const).map(format => <Button key={format} variant="secondary" disabled={busy} onClick={() => void run(() => exportRows(`${kind}-template`, definition.headers, definition.example, format))}>{t("Şablon indir", "Download template")} · {format.toUpperCase()}</Button>)}
      {(kind === "stocks" || kind === "purchase-orders") && <Button variant="secondary" disabled={busy} onClick={() => void run(async () => {
        const [products, warehouses, suppliers] = await Promise.all([apiClient<{ name: string; sku: string }[]>("/api/products"), apiClient<{ name: string; location: string }[]>("/api/warehouses"), apiClient<{ name: string; email: string }[]>("/api/suppliers")]);
        if (products.length + warehouses.length + suppliers.length > 5000) throw new Error(t("Referans listesi sınırı 5000 kayıttır.", "Reference list limit is 5000 records."));
        await exportRows("company-import-references", ["Type", "Name", "SkuOrEmail", "Location"], [...products.map(p => ["Product", p.name, p.sku, ""]), ...warehouses.map(w => ["Warehouse", w.name, "", w.location]), ...suppliers.map(s => ["Supplier", s.name, s.email, ""])], "xlsx");
      })}>{t("SKU / depo / tedarikçi listesini indir", "Download SKU / warehouse / supplier reference list")}</Button>}
    </div>
    <label className="block text-sm">{t("Dosya seç", "Choose file")}<input ref={fileInput} className="field mt-2" type="file" accept=".csv,.xlsx" disabled={busy} onChange={e => void choose(e.target.files?.[0])} /></label>
    {busy && <p role="status">{t("İşleniyor…", "Processing…")}</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    {preview && !currentPreview && <p role="alert">{t("Şirket değişti. Dosyayı yeniden yükleyin.", "Company changed. Upload the file again.")}</p>}
    {currentPreview && <div className="space-y-4">
      <p className="text-sm">{rows.length} {t("satır", "rows")} · {currentPreview.errors.length} {t("hata", "errors")}</p>
      {currentPreview.alreadyImported && <p role="status">{t("Bu dosya daha önce aktarıldı. Yeni kayıt eklenmeyecek.", "This file was already imported. No records will be added.")}</p>}
      {currentPreview.errors.length > 0 && <><ul role="alert" className="max-h-52 overflow-auto text-sm text-danger">{currentPreview.errors.slice(0, 30).map((e, i) => <li key={i}>{t("Satır", "Row")} {e.row} · {e.column}: {e.message}</li>)}</ul><Button variant="secondary" disabled={busy} onClick={() => void run(() => exportRows(`${kind}-errors`, ["Row", "Column", "Error"], currentPreview.errors.map(e => [e.row, e.column, e.message]), "xlsx"))}>{t("Tüm hataları indir", "Download all errors")}</Button></>}
      <div className="overflow-x-auto"><table className="data-table"><caption className="mb-2 text-left text-sm text-muted">{t("İlk 10 satırın önizlemesi", "Preview of the first 10 rows")}</caption><thead><tr><th>#</th>{definition.headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.slice(0, 10).map((r, i) => <tr key={i}><td>{i + 2}</td>{definition.headers.map(h => <td key={h}>{r[h[0].toLowerCase() + h.slice(1)]}</td>)}</tr>)}</tbody></table></div>
      <Button disabled={busy || currentPreview.errors.length > 0 || currentPreview.alreadyImported} onClick={() => void commit()}>{t("Doğrulanan kayıtları ekle", "Import validated records")}</Button>
    </div>}
    {notice && <p role="status" className="text-success">{notice}</p>}
  </section>;
}
