import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { WarehousesList } from "@/features/warehouses/components/warehouses-list";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.warehouses.title };
export default function Page() {
  return (
    <>
      <PageHeader
        title={m.warehouses.title}
        description={m.warehouses.description}
        action={
          <LinkButton href="/warehouses/new">
            <Plus className="size-4" />
            {m.warehouses.new}
          </LinkButton>
        }
      />
      <WarehousesList />
    </>
  );
}
