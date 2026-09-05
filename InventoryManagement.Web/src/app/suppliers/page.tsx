import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { SuppliersList } from "@/features/suppliers/components/suppliers-list";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.suppliers.title };
export default function Page() {
  return (
    <>
      <PageHeader
        title={m.suppliers.title}
        description={m.suppliers.description}
        action={
          <LinkButton href="/suppliers/new">
            <Plus className="size-4" />
            {m.suppliers.new}
          </LinkButton>
        }
      />
      <SuppliersList />
    </>
  );
}
