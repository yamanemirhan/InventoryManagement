"use client";
import { ApiError } from "@/lib/api/api-error";
import { getErrorMessage } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useProduct } from "../hooks/use-products";

export function ProductDetail({ id }: { id: string }) {
  const product = useProduct(id);
  if (product.isPending) return <LoadingState label="Loading product..." />;
  if (product.isError) {
    if (product.error instanceof ApiError && product.error.status === 404) return <ErrorState message="The requested product does not exist or is no longer available." />;
    return <ErrorState message={getErrorMessage(product.error)} onRetry={() => product.refetch()} />;
  }
  return <Card className="max-w-2xl"><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</dt><dd className="mt-1 font-medium text-slate-950">{product.data.name}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">SKU</dt><dd className="mt-1 font-mono text-slate-700">{product.data.sku}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product ID</dt><dd className="mt-1 break-all font-mono text-sm text-slate-700">{product.data.id}</dd></div></dl></Card>;
}
