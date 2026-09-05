import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { ProductsList } from "@/features/products/components/products-list";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.products.title };
export default function Page() {
  return (
    <>
      <PageHeader
        title={m.products.title}
        description={m.products.description}
        action={
          <LinkButton href="/products/new">
            <Plus className="size-4" />
            {m.products.new}
          </LinkButton>
        }
      />
      <ProductsList />
    </>
  );
}
