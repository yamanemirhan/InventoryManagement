import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { TransferStockForm } from "@/features/stocks/components/transfer-stock-form";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.stocks.transfer };
}
export default async function Page() {
  const { m } = await getI18n();

  return (
    <>
      <PageHeader
        title={m.stocks.transfer}
        description={m.stocks.transferDescription}
        action={
          <LinkButton secondary href="/stocks">
            ← {m.stocks.title}
          </LinkButton>
        }
      />
      <TransferStockForm />
    </>
  );
}
