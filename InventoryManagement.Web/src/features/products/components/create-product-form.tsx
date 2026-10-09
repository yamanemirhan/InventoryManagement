"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { applyApiFieldErrors } from "@/lib/forms/apply-api-errors";
import { getErrorMessage } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useCreateProduct } from "../hooks/use-products";
import { useCompanyText } from "@/features/companies/company-provider";
import { CodeReader } from "@/features/scanning/code-reader";
import { useState } from "react";
import {
  createProductSchema,
  type CreateProductFormValues,
} from "../schemas/product-schema";
export function CreateProductForm() {
  const { m } = useI18n();
  const t = useCompanyText();
  const [read, setRead] = useState(false);

  const router = useRouter();
  const mutation = useCreateProduct();
  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema(m, t("En fazla 100 ASCII karakter; boşluk ve inventory: öneki kullanmayın.", "Up to 100 ASCII characters; no spaces or inventory: prefix."))),
    defaultValues: { name: "", sku: "", barcode: "" },
  });
  const submit = form.handleSubmit(async (values) => {
    mutation.reset();
    try {
      const id = await mutation.mutateAsync(values);
      router.push(`/products/${id}`);
    } catch (error) {
      applyApiFieldErrors(error, form.setError, { name: "name", sku: "sku", barcode: "barcode" });
    }
  });
  return (
    <form
      onSubmit={submit}
      className="panel max-w-2xl space-y-6 p-7"
      noValidate
    >
      {mutation.isError && (
        <Alert title={m.common.formError} tone="error">
          {getErrorMessage(mutation.error)}
        </Alert>
      )}
      <FormField
        label={m.common.name}
        htmlFor="name"
        error={form.formState.errors.name?.message}
      >
        <Input
          id="name"
          autoComplete="off"
          placeholder={m.products.namePlaceholder}
          {...form.register("name")}
        />
      </FormField>
      <FormField
        label={m.common.sku}
        htmlFor="sku"
        error={form.formState.errors.sku?.message}
      >
        <Input
          id="sku"
          autoComplete="off"
          placeholder={m.products.skuPlaceholder}
          {...form.register("sku")}
        />
      </FormField>
      <FormField label={t("Üretici barkodu (isteğe bağlı)", "Manufacturer barcode (optional)")} htmlFor="barcode" error={form.formState.errors.barcode?.message}>
        <Input id="barcode" autoComplete="off" maxLength={100} {...form.register("barcode")} />
      </FormField>
      <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => setRead(!read)} aria-expanded={read}>{t("Üretici barkodunu okut", "Scan manufacturer barcode")}</Button>
      {read && <CodeReader disabled={mutation.isPending} onRead={code => { form.setValue("barcode", code, { shouldValidate: true, shouldDirty: true }); setRead(false); }} />}
      <div className="flex gap-3 border-t border-line pt-6">
        <Button
          type="submit"
          disabled={mutation.isPending || form.formState.isSubmitting}
        >
          {mutation.isPending ? m.common.creating : m.products.create}
        </Button>
        <LinkButton secondary href="/products">
          {m.common.cancel}
        </LinkButton>
      </div>
    </form>
  );
}
