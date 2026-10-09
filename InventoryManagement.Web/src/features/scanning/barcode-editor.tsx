"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompanyText } from "@/features/companies/company-provider";
import { productKeys } from "@/features/products/api/products-api";
import { apiClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";
import { CodeReader } from "./code-reader";

export function BarcodeEditor({ id, initial }: { id: string; initial?: string | null }) {
  const t = useCompanyText();
  const [value, setValue] = useState(initial ?? "");
  const [read, setRead] = useState(false);
  const query = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => apiClient(`/api/products/${id}/barcode`, { method: "PUT", body: { barcode: value.trim() || null } }),
    onSuccess: () => query.invalidateQueries({ queryKey: productKeys.all }),
  });
  return <div className="mt-7 space-y-3 border-t border-line pt-6">
    <label htmlFor={`barcode-${id}`} className="block text-sm font-semibold">{t("Üretici barkodu (isteğe bağlı)", "Manufacturer barcode (optional)")}</label>
    <p className="text-xs text-muted">{t("Baştaki sıfırlar korunur. En fazla 100 karakter; boşluk kullanmayın. Boş kaydetmek barkodu kaldırır.", "Leading zeros are preserved. Up to 100 characters without spaces. Save empty to remove the barcode.")}</p>
    <div className="flex flex-wrap gap-2">
      <Input id={`barcode-${id}`} className="max-w-sm" value={value} maxLength={100} autoComplete="off" spellCheck={false} disabled={mutation.isPending} onChange={e => { setValue(e.target.value); mutation.reset(); }} />
      <Button type="button" disabled={mutation.isPending || value.trim() === (initial ?? "")} onClick={() => mutation.mutate()}>{mutation.isPending ? t("Kaydediliyor…", "Saving…") : t("Barkodu kaydet", "Save barcode")}</Button>
      <Button type="button" variant="secondary" disabled={mutation.isPending} aria-expanded={read} onClick={() => setRead(!read)}>{t("Kod okut", "Scan code")}</Button>
    </div>
    {read && <CodeReader disabled={mutation.isPending} onRead={code => { setValue(code); setRead(false); mutation.reset(); }} />}
    {mutation.isError && <p role="alert" className="text-sm text-danger">{getErrorMessage(mutation.error)}</p>}
    {mutation.isSuccess && <p role="status" className="text-sm text-brand">{t("Barkod kaydedildi.", "Barcode saved.")}</p>}
  </div>;
}
