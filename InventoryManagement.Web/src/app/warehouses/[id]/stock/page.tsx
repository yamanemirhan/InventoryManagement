import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { WarehouseStockViewer } from "@/features/stocks/components/warehouse-stock-viewer";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.stocks.title };
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { m } = await getI18n();

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
