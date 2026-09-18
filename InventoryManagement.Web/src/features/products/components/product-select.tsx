"use client";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { useProducts } from "../hooks/use-products";
import { useI18n } from "@/lib/i18n/provider";
export const ProductSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { emptyLabel?: string }
>(function ProductSelect({ emptyLabel, ...props }, ref) {
  const { m } = useI18n();
  const query = useProducts();
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
            : (emptyLabel ?? m.common.selectProduct)}
      </option>
      {query.data?.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} — {p.sku}
        </option>
      ))}
    </select>
  );
});
