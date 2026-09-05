"use client";
import { useWarehouse } from "../hooks/use-warehouses";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { messages as m } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedWarehouseId } from "@/store/slices/inventory-ui-slice";
export function WarehouseDetail({ id }: { id: string }) {
  const query = useWarehouse(id);
  const dispatch = useAppDispatch();
  const selected = useAppSelector((s) => s.inventoryUi.selectedWarehouseId);
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
      <p className="mt-2 text-sm text-muted">{query.data.location}</p>
      <p className="mt-5 break-all font-mono text-xs text-muted">
        {query.data.id}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href={`/warehouses/${id}/stock`}>
          {m.warehouses.stock}
        </LinkButton>
        <LinkButton secondary href={`/warehouses/${id}/history`}>
          {m.warehouses.history}
        </LinkButton>
        <Button
          variant="ghost"
          disabled={selected === id}
          onClick={() => dispatch(setSelectedWarehouseId(id))}
        >
          {selected === id ? m.warehouses.selected : m.warehouses.select}
        </Button>
      </div>
    </Card>
  );
}
