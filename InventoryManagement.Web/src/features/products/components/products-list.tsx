"use client";
import Link from "next/link";
import { Package, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useProducts } from "../hooks/use-products";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { getErrorMessage } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
export function ProductsList() {
  const { m } = useI18n();

  const query = useProducts();
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
        title={m.products.empty}
        description={m.products.emptyDescription}
      />
    );
  const rows = query.data.filter((p) =>
    (p.name + " " + p.sku).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="panel overflow-hidden">
      <ListToolbar value={search} onChange={setSearch} count={rows.length} />
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{m.common.product}</th>
              <th>{m.common.sku}</th>
              <th>
                <span className="sr-only">{m.common.action}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    href={`/products/${p.id}`}
                    className="flex items-center gap-3 font-medium"
                  >
                    <span className="rounded-lg bg-subtle p-2.5">
                      <Package
                        className="size-4 text-muted"
                        strokeWidth={1.5}
                      />
                    </span>
                    {p.name}
                  </Link>
                </td>
                <td>
                  <span className="rounded-md bg-subtle px-2.5 py-1 font-mono text-xs text-muted">
                    {p.sku}
                  </span>
                </td>
                <td className="text-right">
                  <Link
                    href={`/products/${p.id}`}
                    className="inline-flex items-center gap-2 text-xs font-medium text-brand"
                  >
                    {m.common.view}
                    <ArrowUpRight className="size-3.5" />
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
