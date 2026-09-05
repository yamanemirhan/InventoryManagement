"use client";
import Link from "next/link";
import { MapPin, ArrowUpRight, Warehouse } from "lucide-react";
import { useState } from "react";
import { useWarehouses } from "../hooks/use-warehouses";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { getErrorMessage } from "@/lib/utils";
import { messages as m } from "@/lib/i18n";
export function WarehousesList() {
  const query = useWarehouses();
  const [search, setSearch] = useState("");
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return (
      <ErrorState
        message={getErrorMessage(query.error)}
        onRetry={() => query.refetch()}
      />
    );
  if (!query.data.length)
    return (
      <EmptyState
        title={m.warehouses.empty}
        description={m.warehouses.emptyDescription}
      />
    );
  const rows = query.data.filter((w) =>
    (w.name + " " + w.location).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="panel overflow-hidden">
      <ListToolbar value={search} onChange={setSearch} count={rows.length} />
      <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((w) => (
          <Link
            key={w.id}
            href={`/warehouses/${w.id}`}
            className="group rounded-xl border border-line p-6 transition-colors hover:border-brand/40"
          >
            <div className="mb-6 flex items-center justify-between">
              <Warehouse className="size-7 text-brand" strokeWidth={1.5} />
              <ArrowUpRight className="size-4 text-muted" />
            </div>
            <h2 className="font-semibold">{w.name}</h2>
            <p className="mt-2 flex items-center gap-2 text-xs text-muted">
              <MapPin className="size-3.5" />
              {w.location}
            </p>
            <p className="mt-7 border-t border-line pt-4 text-xs font-medium text-brand">
              {m.warehouses.stock} →
            </p>
          </Link>
        ))}
      </div>
      {rows.length === 0 && (
        <EmptyState
          title={m.common.emptySearch}
          description={m.common.searchHint}
        />
      )}
    </div>
  );
}
