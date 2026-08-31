"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/api-error";
import { applyApiFieldErrors } from "@/lib/forms/apply-api-errors";
import { getErrorMessage } from "@/lib/utils";
import { useCreateWarehouse } from "../hooks/use-warehouses";
import { createWarehouseSchema, type CreateWarehouseFormValues } from "../schemas/warehouse-schema";

export function CreateWarehouseForm() {
  const mutation = useCreateWarehouse();
  const form = useForm<CreateWarehouseFormValues>({ resolver: zodResolver(createWarehouseSchema), defaultValues: { name: "", location: "" } });
  const submit = form.handleSubmit(async (values) => {
    mutation.reset();
    try { await mutation.mutateAsync(values); form.reset(); }
    catch (error) { applyApiFieldErrors(error, form.setError, { name: "name", location: "location" }); }
  });
  const fieldError = mutation.error instanceof ApiError && mutation.error.errors !== undefined;
  return <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" noValidate>{mutation.isSuccess ? <Alert title="Warehouse created" tone="success"><p>Save this warehouse ID; a listing endpoint is not available yet.</p><code className="mt-2 block break-all rounded bg-white/70 p-2 font-mono text-xs">{mutation.data}</code></Alert> : null}{mutation.isError && !fieldError ? <Alert title="Warehouse could not be created" tone="error">{getErrorMessage(mutation.error)}</Alert> : null}<FormField label="Name" htmlFor="name" error={form.formState.errors.name?.message}><Input id="name" placeholder="Main Warehouse" {...form.register("name")} /></FormField><FormField label="Location" htmlFor="location" error={form.formState.errors.location?.message}><Input id="location" placeholder="Istanbul" {...form.register("location")} /></FormField><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating..." : "Create warehouse"}</Button></form>;
}
