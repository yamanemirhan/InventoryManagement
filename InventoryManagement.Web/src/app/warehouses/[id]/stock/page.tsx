import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { WarehouseStockViewer } from "@/features/stocks/components/warehouse-stock-viewer";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.stocks.title };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return (
    <>
      <PageHeader
        title={m.stocks.title}
        description={m.stocks.description}
        action={
          <div className="flex gap-2">
            <LinkButton secondary href={`/warehouses/${id}`}>
              ← {m.warehouses.detail}
            </LinkButton>
            <LinkButton secondary href={`/warehouses/${id}/history`}>
              {m.warehouses.history}
            </LinkButton>
          </div>
        }
      />
      <WarehouseStockViewer key={id} id={id} />
    </>
  );
}
