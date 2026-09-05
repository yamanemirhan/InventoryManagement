import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { CreateWarehouseForm } from "@/features/warehouses/components/create-warehouse-form";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.warehouses.createTitle };
export default function Page() {
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
