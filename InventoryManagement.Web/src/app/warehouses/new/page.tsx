import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { CreateWarehouseForm } from "@/features/warehouses/components/create-warehouse-form";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.warehouses.createTitle };
}
export default async function Page() {
  const { m } = await getI18n();

  return (
    <>
      <PageHeader
        title={m.warehouses.createTitle}
        description={m.warehouses.createDescription}
        action={
          <LinkButton secondary href="/warehouses">
            ← {m.warehouses.title}
          </LinkButton>
        }
      />
      <CreateWarehouseForm />
    </>
  );
}
