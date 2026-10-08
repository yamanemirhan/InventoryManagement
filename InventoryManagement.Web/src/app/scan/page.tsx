"use client";
import { PageHeader } from "@/components/ui/page-header";
import { ProductScanner } from "@/features/scanning/product-scanner";
import { useCompanyText } from "@/features/companies/company-provider";
export default function ScanPage() {
  const t = useCompanyText();
  return <>
    <PageHeader title={t("QR / barkod okut", "Scan QR / barcode")} description={t("Ürün bulun, etiketine ulaşın. Stok girişinde ve transferde aynı okuyucuyu kullanabilirsiniz.", "Find products and their labels. The same reader is available in stock receipt and transfer forms.")} />
    <div className="max-w-3xl"><ProductScanner expanded /></div>
  </>;
}
