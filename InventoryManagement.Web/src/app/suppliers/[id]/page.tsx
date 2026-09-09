import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { SupplierDetail } from "@/features/suppliers/components/supplier-detail";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.suppliers.detail };
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
        title={m.suppliers.detail}
        description={m.suppliers.detailDescription}
        action={
          <LinkButton secondary href="/suppliers">
            ← {m.suppliers.title}
          </LinkButton>
        }
      />
      <SupplierDetail id={id} />
    </>
  );
}
