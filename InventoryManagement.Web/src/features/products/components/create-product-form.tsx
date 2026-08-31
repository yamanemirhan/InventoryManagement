"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/api-error";
import { applyApiFieldErrors } from "@/lib/forms/apply-api-errors";
import { getErrorMessage } from "@/lib/utils";
import { useCreateProduct } from "../hooks/use-products";
import { createProductSchema, type CreateProductFormValues } from "../schemas/product-schema";

export function CreateProductForm() {
  const router = useRouter();
  const mutation = useCreateProduct();
  const form = useForm<CreateProductFormValues>({ resolver: zodResolver(createProductSchema), defaultValues: { name: "", sku: "" } });
  const submit = form.handleSubmit(async (values) => {
    mutation.reset();
    try { await mutation.mutateAsync(values); router.push("/products"); }
    catch (error) { applyApiFieldErrors(error, form.setError, { name: "name", sku: "sku" }); }
  });
  const fieldError = mutation.error instanceof ApiError && mutation.error.errors !== undefined;
  return <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" noValidate>{mutation.isError && !fieldError ? <Alert title="Product could not be created" tone="error">{getErrorMessage(mutation.error)}</Alert> : null}<FormField label="Name" htmlFor="name" error={form.formState.errors.name?.message}><Input id="name" autoComplete="off" placeholder="Mechanical Keyboard" {...form.register("name")} /></FormField><FormField label="SKU" htmlFor="sku" error={form.formState.errors.sku?.message}><Input id="sku" autoComplete="off" placeholder="KB-001" {...form.register("sku")} /></FormField><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating..." : "Create product"}</Button></form>;
}
