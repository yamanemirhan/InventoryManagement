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
import { useCreateWarehouse } from "../hooks/use-warehouses";
import {
  createWarehouseSchema,
  type CreateWarehouseFormValues,
} from "../schemas/warehouse-schema";
export function CreateWarehouseForm() {
  const router = useRouter();
  const mutation = useCreateWarehouse();
  const form = useForm<CreateWarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: { name: "", location: "" },
  });
  const submit = form.handleSubmit(async (values) => {
    mutation.reset();
    try {
      const id = await mutation.mutateAsync(values);
      router.push(`/warehouses/${id}`);
    } catch (error) {
      applyApiFieldErrors(error, form.setError, {
        name: "name",
        location: "location",
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
          placeholder={m.warehouses.namePlaceholder}
          {...form.register("name")}
        />
      </FormField>
      <FormField
        label={m.common.location}
        htmlFor="location"
        error={form.formState.errors.location?.message}
      >
        <Input
          id="location"
          autoComplete="off"
          placeholder={m.warehouses.locationPlaceholder}
          {...form.register("location")}
        />
      </FormField>
      <div className="flex gap-3 border-t border-line pt-6">
        <Button
          type="submit"
          disabled={mutation.isPending || form.formState.isSubmitting}
        >
          {mutation.isPending ? m.common.creating : m.warehouses.create}
        </Button>
        <LinkButton secondary href="/warehouses">
          {m.common.cancel}
        </LinkButton>
      </div>
    </form>
  );
}
