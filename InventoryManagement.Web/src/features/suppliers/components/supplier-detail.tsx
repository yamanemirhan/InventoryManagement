"use client";
import { CatalogEditor } from "@/features/workspace/catalog-editor";
import { AdminOnly } from "@/features/auth/components/access";
import { useSupplier } from "../hooks/use-suppliers";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { useI18n } from "@/lib/i18n/provider";
import { getErrorMessage } from "@/lib/utils";
export function SupplierDetail({ id }: { id: string }) {
  const { m } = useI18n();

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
        <AdminOnly>
          <LinkButton href="/purchase-orders/new">{m.orders.new}</LinkButton>
        </AdminOnly>
      </div>
      <div className="mt-5">
        <AdminOnly>
          <CatalogEditor
            kind="suppliers"
            id={id}
            name={query.data.name}
            value={query.data.email}
          />
        </AdminOnly>
      </div>
    </Card>
  );
}
