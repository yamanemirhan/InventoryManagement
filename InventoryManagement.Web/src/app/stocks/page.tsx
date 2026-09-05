import { ArrowRightLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { WarehouseStockViewer } from "@/features/stocks/components/warehouse-stock-viewer";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.stocks.title };
export default function Page() {
  return (
    <>
      <PageHeader
        title={m.stocks.title}
        description={m.stocks.description}
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton secondary href="/stocks/transfer">
              <ArrowRightLeft className="size-4" />
              {m.stocks.transfer}
            </LinkButton>
            <LinkButton href="/stocks/increase">
              <Plus className="size-4" />
              {m.stocks.increase}
            </LinkButton>
          </div>
        }
      />
      <WarehouseStockViewer />
    </>
  );
}
