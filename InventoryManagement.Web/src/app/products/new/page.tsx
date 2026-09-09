import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { CreateProductForm } from "@/features/products/components/create-product-form";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.products.createTitle };
}
export default async function Page() {
  const { m } = await getI18n();

  return (
    <>
      <PageHeader
        title={m.products.createTitle}
        description={m.products.createDescription}
        action={
          <LinkButton secondary href="/products">
            ← {m.products.title}
          </LinkButton>
        }
      />
      <CreateProductForm />
    </>
  );
}
