import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { CreateSupplierForm } from "@/features/suppliers/components/create-supplier-form";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.suppliers.createTitle };
}
export default async function Page() {
  const { m } = await getI18n();

  return (
    <>
      <PageHeader
        title={m.suppliers.createTitle}
        description={m.suppliers.createDescription}
        action={
          <LinkButton secondary href="/suppliers">
            ← {m.suppliers.title}
          </LinkButton>
        }
      />
      <CreateSupplierForm />
    </>
  );
}
