"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { getErrorMessage } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedWarehouseId } from "@/store/slices/inventory-ui-slice";
import { useWarehouseStock } from "../hooks/use-stocks";
import { warehouseLookupSchema, type WarehouseLookupFormValues } from "../schemas/stock-schema";

export function WarehouseStockViewer() {
  const selected = useAppSelector((state) => state.inventoryUi.selectedWarehouseId) ?? "";
  const [warehouseId, setWarehouseId] = useState("");
  const dispatch = useAppDispatch();
  const form = useForm<WarehouseLookupFormValues>({ resolver: zodResolver(warehouseLookupSchema), defaultValues: { warehouseId: selected } });
  const stock = useWarehouseStock(warehouseId, warehouseId.length > 0);
  const submit = form.handleSubmit(({ warehouseId: value }) => { setWarehouseId(value); dispatch(setSelectedWarehouseId(value)); });
  return <div className="space-y-5"><form onSubmit={submit} className="flex max-w-2xl flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end" noValidate><div className="flex-1"><FormField label="Warehouse ID" htmlFor="warehouseId" error={form.formState.errors.warehouseId?.message} hint="Warehouse listing is not available; paste a known ID."><Input id="warehouseId" placeholder="00000000-0000-0000-0000-000000000000" {...form.register("warehouseId")} /></FormField></div><Button type="submit">Load stock</Button></form>{warehouseId ? stock.isPending ? <LoadingState label="Loading warehouse stock..." /> : stock.isError ? <ErrorState message={getErrorMessage(stock.error)} onRetry={() => stock.refetch()} /> : stock.data.length === 0 ? <EmptyState title="No stock found" description="This warehouse currently has no stock entries." /> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Product</th><th className="px-5 py-3">SKU</th><th className="px-5 py-3 text-right">Quantity</th></tr></thead><tbody className="divide-y divide-slate-100">{stock.data.map((item) => <tr key={item.productId}><td className="px-5 py-4 font-medium text-slate-950">{item.productName}</td><td className="px-5 py-4 font-mono text-slate-600">{item.sku}</td><td className="px-5 py-4 text-right font-semibold tabular-nums">{item.quantity}</td></tr>)}</tbody></table></div></div> : <EmptyState title="Enter a warehouse ID" description="Use a known warehouse UUID to retrieve its current stock." />}</div>;
}
