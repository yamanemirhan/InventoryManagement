import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { WarehouseDetail } from "@/features/warehouses/components/warehouse-detail";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.warehouses.detail };
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
        title={m.warehouses.detail}
        description={m.warehouses.detailDescription}
        action={
          <LinkButton secondary href="/warehouses">
            ← {m.warehouses.title}
          </LinkButton>
        }
      />
      <WarehouseDetail id={id} />
    </>
  );
}
