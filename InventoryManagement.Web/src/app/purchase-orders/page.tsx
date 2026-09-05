import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { PurchaseOrdersList } from "@/features/purchase-orders/components/purchase-orders-list";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.orders.title };
export default function Page() {
  return (
    <>
      <PageHeader
        title={m.orders.title}
        description={m.orders.description}
        action={
          <LinkButton href="/purchase-orders/new">
            <Plus className="size-4" />
            {m.orders.new}
          </LinkButton>
        }
      />
      <PurchaseOrdersList />
    </>
  );
}
