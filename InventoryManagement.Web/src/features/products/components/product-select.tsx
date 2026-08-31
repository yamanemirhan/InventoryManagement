"use client";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { useProducts } from "../hooks/use-products";
import { cn } from "@/lib/utils";

export const ProductSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function ProductSelect({ className, ...props }, ref) {
  const products = useProducts();
  return <select ref={ref} disabled={products.isPending || products.isError || props.disabled} className={cn("h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100", className)} {...props}><option value="">{products.isPending ? "Loading products..." : products.isError ? "Products unavailable" : "Select a product"}</option>{products.data?.map((product) => <option key={product.id} value={product.id}>{product.name} — {product.sku}</option>)}</select>;
});
