"use client";
import Link from "next/link";
import { useProducts } from "../hooks/use-products";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { getErrorMessage } from "@/lib/utils";

export function ProductsList() {
  const products = useProducts();
  if (products.isPending) return <LoadingState label="Loading products..." />;
  if (products.isError) return <ErrorState message={getErrorMessage(products.error)} onRetry={() => products.refetch()} />;
  if (products.data.length === 0) return <EmptyState title="No products yet" description="Create the first product to start managing stock." />;
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Name</th><th className="px-5 py-3 font-semibold">SKU</th><th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Action</span></th></tr></thead><tbody className="divide-y divide-slate-100">{products.data.map((product) => <tr key={product.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-medium text-slate-950">{product.name}</td><td className="px-5 py-4 font-mono text-slate-600">{product.sku}</td><td className="px-5 py-4 text-right"><Link className="font-semibold text-slate-900 underline-offset-4 hover:underline" href={`/products/${product.id}`}>View</Link></td></tr>)}</tbody></table></div></div>;
}
