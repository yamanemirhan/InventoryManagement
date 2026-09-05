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
import { messages as m } from "@/lib/i18n";
import { useCreateSupplier } from "../hooks/use-suppliers";
import {
  createSupplierSchema,
  type CreateSupplierFormValues,
} from "../schemas/supplier-schema";
export function CreateSupplierForm() {
  const router = useRouter();
  const mutation = useCreateSupplier();
  const form = useForm<CreateSupplierFormValues>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: { name: "", email: "" },
  });
  const submit = form.handleSubmit(async (values) => {
    mutation.reset();
    try {
      const id = await mutation.mutateAsync(values);
      router.push(`/suppliers/${id}`);
    } catch (error) {
      applyApiFieldErrors(error, form.setError, {
        name: "name",
        email: "email",
      });
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
          placeholder={m.suppliers.namePlaceholder}
          {...form.register("name")}
        />
      </FormField>
      <FormField
        label={m.common.email}
        htmlFor="email"
        error={form.formState.errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={m.suppliers.emailPlaceholder}
          {...form.register("email")}
        />
      </FormField>
      <div className="flex gap-3 border-t border-line pt-6">
        <Button
          type="submit"
          disabled={mutation.isPending || form.formState.isSubmitting}
        >
          {mutation.isPending ? m.common.creating : m.suppliers.create}
        </Button>
        <LinkButton secondary href="/suppliers">
          {m.common.cancel}
        </LinkButton>
      </div>
    </form>
  );
}
