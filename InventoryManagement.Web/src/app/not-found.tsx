import { LinkButton } from "@/components/ui/link-button";
import { getI18n } from "@/lib/i18n/server";
export default async function NotFound() {
  const { m } = await getI18n();

  return (
    <div className="panel space-y-5 p-10 text-center">
      <p className="text-5xl font-semibold text-brand">404</p>
      <h1 className="text-xl font-semibold">{m.errors.notFound}</h1>
      <p className="text-sm text-muted">{m.errors.notFoundDescription}</p>
      <LinkButton href="/">{m.app.overview}</LinkButton>
    </div>
  );
}
