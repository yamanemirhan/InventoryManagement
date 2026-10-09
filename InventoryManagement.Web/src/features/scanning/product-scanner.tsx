"use client";
import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { useCompanyText } from "@/features/companies/company-provider";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import { getErrorMessage } from "@/lib/utils";
import type { ProductDto } from "@/features/products/types/product";
import { CodeReader } from "./code-reader";

export function ProductScanner({ onSelect, expanded = false, disabled = false }: {
  onSelect?: (product: ProductDto) => void; expanded?: boolean; disabled?: boolean;
}) {
  const t = useCompanyText();
  const [open, setOpen] = useState(expanded);
  const [busy, setBusy] = useState(false);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function lookup(code: string) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setProduct(null); setError("");
    try {
      const found = await apiClient<ProductDto>(`/api/products/lookup?code=${encodeURIComponent(code)}`, { signal: controller.signal, cache: "no-store" });
      if (controller.signal.aborted) return;
      setProduct(found);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof ApiError && cause.status === 404
        ? t("Bu şirkette kodla eşleşen aktif ürün bulunamadı. Ürün detayına barkodu ekleyin veya SKU kullanın.", "No active product matches this code in this company. Add its barcode in product details or use the SKU.")
        : getErrorMessage(cause));
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return <section className="rounded-xl border border-line bg-surface p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><ScanLine className="size-5 text-brand" />{t("QR / barkod ile ürün bul", "Find a product by QR / barcode")}</h2>
      {!expanded && <Button type="button" variant="ghost" aria-expanded={open} onClick={() => {
        request.current?.abort(); setBusy(false); setProduct(null); setError(""); setOpen(!open);
      }}>{open ? t("Kapat", "Close") : t("Kod okut", "Scan code")}</Button>}
    </div>
    {open && <div className="mt-5 space-y-4">
      <CodeReader onRead={code => { void lookup(code); }} disabled={disabled || busy} />
      {busy && <p role="status" className="text-sm text-muted">{t("Ürün aranıyor…", "Finding product…")}</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {product && <div role="status" className="rounded-lg bg-brand-soft p-4">
        <p className="font-semibold">{product.name}</p><p className="mt-1 break-all font-mono text-xs text-muted">{product.sku}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {onSelect && <Button type="button" disabled={disabled} onClick={() => { onSelect(product); setProduct(null); if (!expanded) setOpen(false); }}>{t("Bu ürünü seç", "Select this product")}</Button>}
          <LinkButton secondary href={`/products/${product.id}`}>{t("Ürün ve etiket", "Product & label")}</LinkButton>
        </div>
      </div>}
      <p className="text-xs leading-5 text-muted">{t("Okutma stok değiştirmez. Şirketin ürünleri içinde arama yapar; işlem için ürünü seçip formu onaylayın.", "Scanning does not change stock. It searches your company's products; select the product and confirm the form to make a change.")}</p>
    </div>}
  </section>;
}
