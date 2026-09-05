import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { IncreaseStockForm } from "@/features/stocks/components/increase-stock-form";
import { messages as m } from "@/lib/i18n";
export const metadata = { title: m.stocks.increase };
export default function Page() {
  return (
    <>
      <PageHeader
        title={m.stocks.increase}
        description={m.stocks.increaseDescription}
        action={
          <LinkButton secondary href="/stocks">
            ← {m.stocks.title}
          </LinkButton>
        }
      />
      <IncreaseStockForm />
    </>
  );
}
