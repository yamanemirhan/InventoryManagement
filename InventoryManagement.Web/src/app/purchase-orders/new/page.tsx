import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { CreatePurchaseOrderForm } from "@/features/purchase-orders/components/create-purchase-order-form";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.orders.createTitle };
}
export default async function Page() {
  const { m } = await getI18n();

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
