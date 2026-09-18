import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { WarehouseDetail } from "@/features/warehouses/components/warehouse-detail";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.warehouses.detail };
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
