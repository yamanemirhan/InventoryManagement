"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type Path } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { useCreatePurchaseOrder } from "../hooks/use-purchase-orders";
import {
  createPurchaseOrderSchema,
  type CreatePurchaseOrderFormValues,
} from "../schemas/purchase-order-schema";
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers";
import { ProductSelect } from "@/features/products/components/product-select";
import { ProductScanner } from "@/features/scanning/product-scanner";
import { WarehouseSelect } from "@/features/warehouses/components/warehouse-select";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { useI18n } from "@/lib/i18n/provider";
import { getErrorMessage } from "@/lib/utils";
import { applyApiFieldErrors } from "@/lib/forms/apply-api-errors";
import { useAppSelector } from "@/store/hooks";
export function CreatePurchaseOrderForm() {
  const { m, formatAmount, formatCount } = useI18n();

  const router = useRouter();
  const suppliers = useSuppliers();
  const mutation = useCreatePurchaseOrder();
  const selected =
    useAppSelector((s) => s.inventoryUi.selectedWarehouseId) ?? "";
  const form = useForm<CreatePurchaseOrderFormValues>({
    resolver: zodResolver(createPurchaseOrderSchema(m)),
    defaultValues: {
      supplierId: "",
      warehouseId: selected,
      items: [{ productId: "", quantity: 1, unitPrice: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const items = useWatch({ control: form.control, name: "items" });
  const lineTotal = (index: number) => {
    const row = items[index];
    return row && Number.isFinite(row.quantity * row.unitPrice)
      ? (Math.round(row.unitPrice * 100) * row.quantity) / 100
      : 0;
  };
  const total = fields.reduce((sum, _, index) => sum + lineTotal(index), 0);
  const submit = form.handleSubmit(async (values) => {
    mutation.reset();
    try {
      const id = await mutation.mutateAsync(values);
      router.push(`/purchase-orders/${id}`);
    } catch (error) {
      const map: Record<string, Path<CreatePurchaseOrderFormValues>> = {
        supplierid: "supplierId",
        warehouseid: "warehouseId",
        items: "items",
      };
      values.items.forEach((_, index) => {
        for (const field of ["productId", "quantity", "unitPrice"] as const)
          map[`items[${index}].${field.toLowerCase()}`] =
            `items.${index}.${field}`;
      });
      applyApiFieldErrors(error, form.setError, map);
    }
  });
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {mutation.isError && (
        <Alert title={m.common.formError} tone="error">
          {getErrorMessage(mutation.error)}
        </Alert>
      )}
      <section className="panel grid gap-6 p-7 sm:grid-cols-2">
        <FormField
          label={m.common.supplier}
          htmlFor="supplierId"
          error={form.formState.errors.supplierId?.message}
        >
          <select
            id="supplierId"
            className="field"
            disabled={suppliers.isPending || suppliers.isError}
            {...form.register("supplierId")}
          >
            <option value="">
              {suppliers.isPending
                ? m.common.loadingOptions
                : suppliers.isError
                  ? m.common.unavailable
                  : m.common.selectSupplier}
            </option>
            {suppliers.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label={m.common.warehouse}
          htmlFor="warehouseId"
          error={form.formState.errors.warehouseId?.message}
        >
          <WarehouseSelect id="warehouseId" {...form.register("warehouseId")} />
        </FormField>
      </section>
      <ProductScanner disabled={mutation.isPending || form.formState.isSubmitting} onSelect={product => {
        const current = form.getValues("items");
        let index = current.findIndex(item => item.productId === product.id);
        if (index < 0) index = current.findIndex(item => !item.productId);
        if (index >= 0) {
          form.setValue(`items.${index}.productId`, product.id, { shouldDirty: true, shouldValidate: true });
          form.setFocus(`items.${index}.quantity`);
        } else if (current.length < 100) {
          append({ productId: product.id, quantity: 1, unitPrice: 0 }, { focusName: `items.${current.length}.quantity` });
        } else form.setError("items", { message: m.orders.maxItems });
      }} />
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-7 py-5">
          <h2 className="text-sm font-semibold">{m.orders.items}</h2>
          <span className="text-xs text-muted">
            {formatCount(fields.length, "item")}
          </span>
        </div>
        <div className="divide-y divide-line">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid items-start gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[minmax(180px,2fr)_minmax(90px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_40px] lg:px-7"
            >
              <FormField
                label={m.common.product}
                htmlFor={`product-${index}`}
                error={form.formState.errors.items?.[index]?.productId?.message}
              >
                <ProductSelect
                  id={`product-${index}`}
                  {...form.register(`items.${index}.productId`)}
                />
              </FormField>
              <FormField
                label={m.common.quantity}
                htmlFor={`quantity-${index}`}
                error={form.formState.errors.items?.[index]?.quantity?.message}
              >
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  step="1"
                  {...form.register(`items.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                />
              </FormField>
              <FormField
                label={m.orders.unitPrice}
                htmlFor={`price-${index}`}
                error={form.formState.errors.items?.[index]?.unitPrice?.message}
              >
                <Input
                  id={`price-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register(`items.${index}.unitPrice`, {
                    valueAsNumber: true,
                  })}
                />
              </FormField>
              <div>
                <p className="text-sm font-medium">{m.orders.lineTotal}</p>
                <p className="mt-2 flex h-11 items-center font-medium tabular-nums">
                  {formatAmount(lineTotal(index))}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mt-7 px-2"
                aria-label={m.orders.removeItem + " " + (index + 1)}
                disabled={fields.length <= 1 || mutation.isPending}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        {(form.formState.errors.items?.message ||
          form.formState.errors.items?.root?.message) && (
          <p role="alert" className="px-7 pb-4 text-sm text-danger">
            {form.formState.errors.items?.message ??
              form.formState.errors.items?.root?.message}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-subtle p-5 sm:px-7">
          <Button
            type="button"
            variant="secondary"
            disabled={fields.length >= 100 || mutation.isPending}
            onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
          >
            <Plus className="size-4" />
            {m.orders.addItem}
          </Button>
          <div className="flex items-center gap-8 text-sm">
            <span className="text-muted">{m.orders.total}</span>
            <strong className="text-xl tabular-nums">
              {formatAmount(total)}
            </strong>
          </div>
        </div>
      </section>
      <p className="text-xs leading-6 text-muted">{m.orders.priceNote}</p>
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={mutation.isPending || form.formState.isSubmitting}
        >
          {mutation.isPending ? m.common.creating : m.orders.create}
        </Button>
        <LinkButton secondary href="/purchase-orders">
          {m.common.cancel}
        </LinkButton>
      </div>
    </form>
  );
}
