import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { ProductDetail } from "@/features/products/components/product-detail";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.products.detail };
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
        title={m.products.detail}
        description={m.products.detailDescription}
        action={
          <LinkButton secondary href="/products">
            ← {m.products.title}
          </LinkButton>
        }
      />
      <ProductDetail id={id} />
    </>
  );
}
