"use client";
import Link from "next/link";
import { useState } from "react";
import { useSuppliers } from "../hooks/use-suppliers";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { getErrorMessage } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
export function SuppliersList() {
  const { m } = useI18n();

  const query = useSuppliers();
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
        title={m.suppliers.empty}
        description={m.suppliers.emptyDescription}
      />
    );
  const rows = query.data.filter((s) =>
    (s.name + " " + s.email).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="panel overflow-hidden">
      <ListToolbar value={search} onChange={setSearch} count={rows.length} />
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{m.common.supplier}</th>
              <th>{m.common.email}</th>
              <th>
                <span className="sr-only">{m.common.action}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link
                    href={`/suppliers/${s.id}`}
                    className="flex items-center gap-3 font-medium"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-xs text-brand">
                      {s.name.slice(0, 2).toUpperCase()}
                    </span>
                    {s.name}
                  </Link>
                </td>
                <td className="text-muted">{s.email}</td>
                <td className="text-right">
                  <Link
                    href={`/suppliers/${s.id}`}
                    className="text-xs font-medium text-brand"
                  >
                    {m.common.view} ↗
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <EmptyState
          title={m.common.emptySearch}
          description={m.common.searchHint}
        />
      )}
    </div>
  );
}
