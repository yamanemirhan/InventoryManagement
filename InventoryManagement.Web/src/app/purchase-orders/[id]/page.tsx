import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { PurchaseOrderDetail } from "@/features/purchase-orders/components/purchase-order-detail";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.orders.detail };
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
        title={m.orders.detail}
        description={m.orders.detailDescription}
        action={
          <LinkButton secondary href="/purchase-orders">
            ← {m.orders.title}
          </LinkButton>
        }
      />
      <PurchaseOrderDetail id={id} />
    </>
  );
}
