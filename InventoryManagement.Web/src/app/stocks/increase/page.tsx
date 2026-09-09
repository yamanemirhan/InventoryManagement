import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { IncreaseStockForm } from "@/features/stocks/components/increase-stock-form";
import { getI18n } from "@/lib/i18n/server";
export async function generateMetadata() {
  const { m } = await getI18n();
  return { title: m.stocks.increase };
}
export default async function Page() {
  const { m } = await getI18n();

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
