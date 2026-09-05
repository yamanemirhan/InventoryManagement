import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { ProductDetail } from "@/features/products/components/product-detail";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.products.detail };
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
