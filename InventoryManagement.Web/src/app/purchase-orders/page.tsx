import { ImportShortcut } from "@/features/operations/import-shortcut";
import { AdminOnly } from "@/features/auth/components/access";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { PurchaseOrdersList } from "@/features/purchase-orders/components/purchase-orders-list";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.orders.title };
}
export default async function Page() {
  const { m } = await getI18n();

  return (
    <>
      <PageHeader
        title={m.orders.title}
        description={m.orders.description}
        action={
          <AdminOnly>
            <LinkButton href="/purchase-orders/new">
              <Plus className="size-4" />
              {m.orders.new}
            </LinkButton>
          </AdminOnly>
        }
      />
      <ImportShortcut />
      <PurchaseOrdersList />
    </>
  );
}
