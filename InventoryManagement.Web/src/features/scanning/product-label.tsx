"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompany, useCompanyText } from "@/features/companies/company-provider";
import type { ProductDto } from "@/features/products/types/product";

export function ProductLabel({ product }: { product: ProductDto }) {
  const { company } = useCompany();
  const t = useCompanyText();
  const qr = useRef<HTMLCanvasElement>(null);
  const barcode = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const code = product.barcode || product.sku;
  const barcodeSupported = /^[\x20-\x7e]{1,100}$/.test(code) && !code.toLowerCase().startsWith("inventory:");
  useEffect(() => {
    let active = true;
    void import("@bwip-js/browser").then(bwip => {
      if (!active || !company || !qr.current) return;
      const qrOptions = { bcid: "qrcode", text: `inventory:v1:${company.id}:product:${product.id}`, scale: 4, padding: 4, eclevel: "M", backgroundcolor: "FFFFFF" };
      bwip.toCanvas(qr.current, qrOptions);
      if (barcodeSupported && barcode.current) bwip.toCanvas(barcode.current, { bcid: "code128", text: code, scale: 2, height: 12, padding: 10, includetext: true, backgroundcolor: "FFFFFF" });
      setReady(true);
    }).catch(() => { if (active) setError(t("Etiket oluşturulamadı. Sayfayı yenileyin.", "Could not generate the label. Reload the page.")); });
    return () => { active = false; };
  }, [company, product.id, code, barcodeSupported, t]);

  function image() {
    if (!qr.current || !ready) return null;
    const canvas = document.createElement("canvas");
    // Maintain the barcode's intrinsic width; long codes must not be squeezed.
    canvas.width = Math.max(680, (barcodeSupported ? barcode.current?.width ?? 0 : 0) + 48);
    canvas.height = 160 + qr.current.height + (barcodeSupported ? (barcode.current?.height ?? 0) + 32 : 0);
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black"; context.font = "bold 22px sans-serif";
    context.fillText(product.name, 24, 36, canvas.width - 48);
    context.font = "16px sans-serif";
    context.fillText(`SKU: ${product.sku}`, 24, 66, canvas.width - 48);
    context.fillText(company?.name ?? "", 24, 92, canvas.width - 48);
    context.drawImage(qr.current, (canvas.width - qr.current.width) / 2, 120);
    if (barcodeSupported && barcode.current) context.drawImage(barcode.current, (canvas.width - barcode.current.width) / 2, 140 + qr.current.height);
    return canvas;
  }
  function download() {
    const canvas = image();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `inventory-label-${product.id}.png`; link.href = canvas.toDataURL("image/png"); link.click();
  }
  function print() {
    const canvas = image();
    if (!canvas) return;
    const frame = document.createElement("iframe");
    frame.title = "Inventory label";
    frame.style.cssText = "position:fixed;width:0;height:0;border:0";
    document.body.append(frame);
    const target = frame.contentDocument;
    if (!target) { frame.remove(); return; }
    const style = target.createElement("style");
    style.textContent = "@page{margin:10mm}body{margin:0}img{max-width:100%;width:100mm;height:auto}";
    target.head.append(style);
    const img = target.createElement("img");
    img.alt = product.name;
    img.onload = () => {
      frame.contentWindow?.addEventListener("afterprint", () => frame.remove(), { once: true });
      frame.contentWindow?.focus(); frame.contentWindow?.print();
      // Browsers that omit afterprint must not leave an iframe mounted indefinitely.
      window.setTimeout(() => frame.remove(), 60_000);
    };
    img.src = canvas.toDataURL("image/png"); target.body.append(img);
  }
  return <section className="mt-7 border-t border-line pt-6">
    <h2 className="text-sm font-semibold">{t("Ürün etiketi", "Product label")}</h2>
    <p className="mt-2 text-xs leading-5 text-muted">{t("QR şirket ve ürün kimliğini taşır; SKU değişince de çalışır. Barkod üretici kodunu, yoksa SKU'yu kullanır.", "QR contains company and product IDs and survives SKU changes. The barcode uses the manufacturer's code, or the SKU if absent.")}</p>
    <div className="mt-4 flex flex-wrap items-center gap-5">
      <canvas ref={qr} className="h-auto w-40 bg-white" role="img" aria-label={t("Ürün QR etiketi", "Product QR label")} />
      {barcodeSupported && <div className="max-w-full overflow-x-auto rounded bg-white p-2"><canvas ref={barcode} className="max-h-28" role="img" aria-label={t("Ürün barkod etiketi", "Product barcode label")} /></div>}
    </div>
    {!barcodeSupported && <p className="mt-3 text-xs text-muted">{t("Bu SKU Code 128 için uygun değil. QR etiketi kullanın veya üretici barkodu ekleyin.", "This SKU is not supported by Code 128. Use the QR label or add a manufacturer barcode.")}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-2">
      <Button type="button" variant="secondary" disabled={!ready} onClick={download}><Download className="size-4" />{t("Etiket indir (PNG)", "Download label (PNG)")}</Button>
      <Button type="button" variant="secondary" disabled={!ready} onClick={print}><Printer className="size-4" />{t("Yazdır", "Print")}</Button>
    </div>
  </section>;
}
