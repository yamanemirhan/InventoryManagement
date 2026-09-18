import { AdminOnly } from "@/features/auth/components/access";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { WarehousesList } from "@/features/warehouses/components/warehouses-list";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.warehouses.title };
}
export default async function Page() {
  const { m } = await getI18n();

  return (
    <>
      <PageHeader
        title={m.warehouses.title}
        description={m.warehouses.description}
        action={
          <AdminOnly>
            <LinkButton href="/warehouses/new">
              <Plus className="size-4" />
              {m.warehouses.new}
            </LinkButton>
          </AdminOnly>
        }
      />
      <WarehousesList />
    </>
  );
}
