"use client";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { useProducts } from "../hooks/use-products";
import { messages as m } from "@/lib/i18n";
export const ProductSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function ProductSelect(props, ref) {
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
            : m.common.selectProduct}
      </option>
      {query.data?.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} — {p.sku}
        </option>
      ))}
    </select>
  );
});
