import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { TransferStockForm } from "@/features/stocks/components/transfer-stock-form";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.stocks.transfer };
export default function Page() {
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
