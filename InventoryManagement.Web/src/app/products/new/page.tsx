import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { CreateProductForm } from "@/features/products/components/create-product-form";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.products.createTitle };
export default function Page() {
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
