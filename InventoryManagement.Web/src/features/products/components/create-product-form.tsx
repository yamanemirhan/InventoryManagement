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
import {
  createProductSchema,
  type CreateProductFormValues,
} from "../schemas/product-schema";
export function CreateProductForm() {
  const { m } = useI18n();

  const router = useRouter();
  const mutation = useCreateProduct();
  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema(m)),
    defaultValues: { name: "", sku: "" },
  });
  const submit = form.handleSubmit(async (values) => {
    mutation.reset();
    try {
      const id = await mutation.mutateAsync(values);
      router.push(`/products/${id}`);
    } catch (error) {
      applyApiFieldErrors(error, form.setError, { name: "name", sku: "sku" });
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
