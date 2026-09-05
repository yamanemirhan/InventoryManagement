"use client";
import { getErrorMessage } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/link-button";
import { messages as m } from "@/lib/i18n";
import { useProduct } from "../hooks/use-products";
export function ProductDetail({ id }: { id: string }) {
  const query = useProduct(id);
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
      <dl className="grid gap-7 sm:grid-cols-2">
        {[
          [m.common.name, query.data.name],
          [m.common.sku, query.data.sku],
          [m.common.id, query.data.id],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-2 break-all text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8">
        <LinkButton href="/stocks/increase">{m.stocks.increase}</LinkButton>
      </div>
    </Card>
  );
}
