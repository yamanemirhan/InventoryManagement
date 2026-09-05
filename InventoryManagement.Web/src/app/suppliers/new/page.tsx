import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { CreateSupplierForm } from "@/features/suppliers/components/create-supplier-form";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.suppliers.createTitle };
export default function Page() {
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
