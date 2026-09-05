"use client";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { useWarehouses } from "../hooks/use-warehouses";
import { messages as m } from "@/lib/i18n";
export const WarehouseSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function WarehouseSelect(props, ref) {
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
            : m.common.selectWarehouse}
      </option>
      {query.data?.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name} — {w.location}
        </option>
      ))}
    </select>
  );
});
