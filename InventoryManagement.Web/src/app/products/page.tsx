import { ImportShortcut } from "@/features/operations/import-shortcut";
import { AdminOnly } from "@/features/auth/components/access";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { ProductImport } from "@/features/operations/product-import";
import { ProductsList } from "@/features/products/components/products-list";
import { ProductScanner } from "@/features/scanning/product-scanner";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.products.title };
}
export default async function Page() {
  const { m } = await getI18n();

  return (
    <>
      <PageHeader
        title={m.products.title}
        description={m.products.description}
        action={
          <AdminOnly>
            <LinkButton href="/products/new">
              <Plus className="size-4" />
              {m.products.new}
            </LinkButton>
          </AdminOnly>
        }
      />
      <ImportShortcut />
      <ProductScanner />
      <ProductsList />
      <AdminOnly>
        <ProductImport />
      </AdminOnly>
    </>
  );
}
