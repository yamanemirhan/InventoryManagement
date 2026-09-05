import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { SupplierDetail } from "@/features/suppliers/components/supplier-detail";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.suppliers.detail };
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
