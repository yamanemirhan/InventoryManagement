import { AdminOnly } from "@/features/auth/components/access";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { SuppliersList } from "@/features/suppliers/components/suppliers-list";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.suppliers.title };
}
export default async function Page() {
  const { m } = await getI18n();

  return (
    <>
      <PageHeader
        title={m.suppliers.title}
        description={m.suppliers.description}
        action={
          <AdminOnly>
            <LinkButton href="/suppliers/new">
              <Plus className="size-4" />
              {m.suppliers.new}
            </LinkButton>
          </AdminOnly>
        }
      />
      <SuppliersList />
    </>
  );
}
