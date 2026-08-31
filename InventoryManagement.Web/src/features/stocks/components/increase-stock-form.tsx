"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ProductSelect } from "@/features/products/components/product-select";
import { ApiError } from "@/lib/api/api-error";
import { applyApiFieldErrors } from "@/lib/forms/apply-api-errors";
import { getErrorMessage } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedWarehouseId } from "@/store/slices/inventory-ui-slice";
import { useIncreaseStock } from "../hooks/use-stocks";
import { increaseStockSchema, type IncreaseStockFormValues } from "../schemas/stock-schema";

export function IncreaseStockForm() {
  const selected = useAppSelector((state) => state.inventoryUi.selectedWarehouseId) ?? "";
  const dispatch = useAppDispatch();
  const mutation = useIncreaseStock();
  const form = useForm<IncreaseStockFormValues>({ resolver: zodResolver(increaseStockSchema), defaultValues: { productId: "", warehouseId: selected, quantity: 1 } });
  const submit = form.handleSubmit(async (values) => { mutation.reset(); try { await mutation.mutateAsync(values); dispatch(setSelectedWarehouseId(values.warehouseId)); } catch (error) { applyApiFieldErrors(error, form.setError, { productid: "productId", warehouseid: "warehouseId", quantity: "quantity" }); } });
  const fieldError = mutation.error instanceof ApiError && mutation.error.errors !== undefined;
  return <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" noValidate>{mutation.isSuccess ? <Alert title="Stock increased" tone="success">The warehouse stock query has been refreshed.</Alert> : null}{mutation.isError && !fieldError ? <Alert title="Stock could not be increased" tone="error">{getErrorMessage(mutation.error)}</Alert> : null}<FormField label="Product" htmlFor="productId" error={form.formState.errors.productId?.message}><ProductSelect id="productId" {...form.register("productId")} /></FormField><FormField label="Warehouse ID" htmlFor="warehouseId" error={form.formState.errors.warehouseId?.message} hint="A warehouse list endpoint is not currently available."><Input id="warehouseId" placeholder="Warehouse UUID" {...form.register("warehouseId")} /></FormField><FormField label="Quantity" htmlFor="quantity" error={form.formState.errors.quantity?.message}><Input id="quantity" type="number" min="1" step="1" {...form.register("quantity", { valueAsNumber: true })} /></FormField><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Increasing..." : "Increase stock"}</Button></form>;
}
