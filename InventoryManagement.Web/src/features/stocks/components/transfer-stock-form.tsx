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
import { useTransferStock } from "../hooks/use-stocks";
import { transferStockSchema, type TransferStockFormValues } from "../schemas/stock-schema";

export function TransferStockForm() {
  const selected = useAppSelector((state) => state.inventoryUi.selectedWarehouseId) ?? "";
  const dispatch = useAppDispatch();
  const mutation = useTransferStock();
  const form = useForm<TransferStockFormValues>({ resolver: zodResolver(transferStockSchema), defaultValues: { productId: "", sourceWarehouseId: selected, targetWarehouseId: "", quantity: 1 } });
  const submit = form.handleSubmit(async (values) => { mutation.reset(); try { await mutation.mutateAsync(values); dispatch(setSelectedWarehouseId(values.sourceWarehouseId)); } catch (error) { applyApiFieldErrors(error, form.setError, { productid: "productId", sourcewarehouseid: "sourceWarehouseId", targetwarehouseid: "targetWarehouseId", quantity: "quantity" }); } });
  const fieldError = mutation.error instanceof ApiError && mutation.error.errors !== undefined;
  const message = mutation.error instanceof ApiError && mutation.error.isConcurrencyConflict ? "Stock changed while the operation was being processed. Please try again." : getErrorMessage(mutation.error);
  return <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" noValidate>{mutation.isSuccess ? <Alert title="Stock transferred" tone="success">Source and target warehouse stock queries have been refreshed.</Alert> : null}{mutation.isError && !fieldError ? <Alert title="Transfer could not be completed" tone="error">{message}</Alert> : null}<FormField label="Product" htmlFor="productId" error={form.formState.errors.productId?.message}><ProductSelect id="productId" {...form.register("productId")} /></FormField><FormField label="Source warehouse ID" htmlFor="sourceWarehouseId" error={form.formState.errors.sourceWarehouseId?.message}><Input id="sourceWarehouseId" placeholder="Source warehouse UUID" {...form.register("sourceWarehouseId")} /></FormField><FormField label="Target warehouse ID" htmlFor="targetWarehouseId" error={form.formState.errors.targetWarehouseId?.message}><Input id="targetWarehouseId" placeholder="Target warehouse UUID" {...form.register("targetWarehouseId")} /></FormField><FormField label="Quantity" htmlFor="quantity" error={form.formState.errors.quantity?.message}><Input id="quantity" type="number" min="1" step="1" {...form.register("quantity", { valueAsNumber: true })} /></FormField><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Transferring..." : "Transfer stock"}</Button></form>;
}
