"use client";
import { useSupplier } from "../hooks/use-suppliers";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { messages as m } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
export function SupplierDetail({ id }: { id: string }) {
  const query = useSupplier(id);
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return (
      <ErrorState
        message={getErrorMessage(query.error)}
        onRetry={() => query.refetch()}
      />
    );
  return (
    <Card>
      <h2 className="text-xl font-semibold">{query.data.name}</h2>
      <p className="mt-3 text-sm text-muted">{query.data.email}</p>
      <p className="mt-5 break-all font-mono text-xs text-muted">
        {query.data.id}
      </p>
      <div className="mt-8">
        <LinkButton href="/purchase-orders/new">{m.orders.new}</LinkButton>
      </div>
    </Card>
  );
}
