"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ProductSelect } from "@/features/products/components/product-select";
import { WarehouseSelect } from "@/features/warehouses/components/warehouse-select";
import { ApiError } from "@/lib/api/api-error";
import { applyApiFieldErrors } from "@/lib/forms/apply-api-errors";
import { getErrorMessage } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedWarehouseId } from "@/store/slices/inventory-ui-slice";
import { useIncreaseStock } from "../hooks/use-stocks";
import {
  increaseStockSchema,
  type IncreaseStockFormValues,
} from "../schemas/stock-schema";
export function IncreaseStockForm() {
  const { m } = useI18n();

  const selected =
    useAppSelector((s) => s.inventoryUi.selectedWarehouseId) ?? "";
  const dispatch = useAppDispatch();
  const mutation = useIncreaseStock();
  const form = useForm<IncreaseStockFormValues>({
    resolver: zodResolver(increaseStockSchema(m)),
    defaultValues: { productId: "", warehouseId: selected, quantity: 1 },
  });
  const submit = form.handleSubmit(async (values) => {
    mutation.reset();
    try {
      await mutation.mutateAsync(values);
      dispatch(setSelectedWarehouseId(values.warehouseId));
      form.reset({ ...values, productId: "", quantity: 1 });
    } catch (error) {
      applyApiFieldErrors(error, form.setError, {
        productid: "productId",
        quantity: "quantity",
        warehouseid: "warehouseId",
      });
    }
  });
  const error =
    mutation.error instanceof ApiError && mutation.error.isConcurrencyConflict
      ? m.common.conflict
      : getErrorMessage(mutation.error);
  return (
    <form
      onSubmit={submit}
      className="panel max-w-2xl space-y-6 p-7"
      noValidate
    >
      {mutation.isSuccess && (
        <Alert title={m.stocks.received} tone="success">
          {m.stocks.receivedDescription}
        </Alert>
      )}
      {mutation.isError && (
        <Alert title={m.common.formError} tone="error">
          {error}
        </Alert>
      )}
      <FormField
        label={m.common.product}
        htmlFor="productId"
        error={form.formState.errors.productId?.message}
      >
        <ProductSelect id="productId" {...form.register("productId")} />
      </FormField>
      <FormField
        label={m.common.warehouse}
        htmlFor="warehouseId"
        error={form.formState.errors.warehouseId?.message}
      >
        <WarehouseSelect id="warehouseId" {...form.register("warehouseId")} />
      </FormField>
      <FormField
        label={m.common.quantity}
        htmlFor="quantity"
        error={form.formState.errors.quantity?.message}
      >
        <Input
          id="quantity"
          type="number"
          min="1"
          max="2147483647"
          step="1"
          {...form.register("quantity", { valueAsNumber: true })}
        />
      </FormField>
      <p className="text-xs leading-6 text-muted">{m.stocks.operationNote}</p>
      <div className="border-t border-line pt-6">
        <Button
          type="submit"
          disabled={mutation.isPending || form.formState.isSubmitting}
        >
          {mutation.isPending ? m.common.pending : m.stocks.increase}
        </Button>
      </div>
    </form>
  );
}
