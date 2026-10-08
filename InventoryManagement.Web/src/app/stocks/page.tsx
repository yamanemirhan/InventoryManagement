import { ImportShortcut } from "@/features/operations/import-shortcut";
import { AdminOnly } from "@/features/auth/components/access";
import { ArrowRightLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { WarehouseStockViewer } from "@/features/stocks/components/warehouse-stock-viewer";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.stocks.title };
}
export default async function Page() {
  const { m, locale } = await getI18n();

  return (
    <>
      <PageHeader
        title={m.stocks.title}
        description={m.stockOverview.description}
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton secondary href="/reports">
              {locale === "tr" ? "Sayım ve raporlar" : "Counts & reports"}
            </LinkButton>
            <LinkButton secondary href="/stocks/transfer">
              <ArrowRightLeft className="size-4" />
              {m.stocks.transfer}
            </LinkButton>
            <AdminOnly>
              <LinkButton href="/stocks/increase">
                <Plus className="size-4" />
                {m.stocks.increase}
              </LinkButton>
            </AdminOnly>
          </div>
        }
      />
      <ImportShortcut />
      <WarehouseStockViewer />
    </>
  );
}
