"use client";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { useWarehouses } from "../hooks/use-warehouses";
import { useI18n } from "@/lib/i18n/provider";
export const WarehouseSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { emptyLabel?: string }
>(function WarehouseSelect({ emptyLabel, ...props }, ref) {
  const { m } = useI18n();
  const query = useWarehouses();
  return (
    <select
      {...props}
      ref={ref}
      className="field"
      disabled={props.disabled || query.isPending || query.isError}
    >
      <option value="">
        {query.isPending
          ? m.common.loadingOptions
          : query.isError
            ? m.common.unavailable
            : (emptyLabel ?? m.common.selectWarehouse)}
      </option>
      {query.data?.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name} — {w.location}
        </option>
      ))}
    </select>
  );
});
