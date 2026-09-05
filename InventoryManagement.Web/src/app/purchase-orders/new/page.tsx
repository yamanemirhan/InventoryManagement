import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { CreatePurchaseOrderForm } from "@/features/purchase-orders/components/create-purchase-order-form";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.orders.createTitle };
export default function Page() {
  return (
    <>
      <PageHeader
        title={m.orders.createTitle}
        description={m.orders.createDescription}
        action={
          <LinkButton secondary href="/purchase-orders">
            ← {m.orders.title}
          </LinkButton>
        }
      />
      <CreatePurchaseOrderForm />
    </>
  );
}
