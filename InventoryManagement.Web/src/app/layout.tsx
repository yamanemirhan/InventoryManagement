import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "./providers";
import { getI18n } from "@/lib/i18n/server";
import "./globals.css";
export async function generateMetadata() {
  const { m } = await getI18n();
  return {
    title: { default: m.app.name, template: "%s | " + m.app.name },
    description: m.home.description,
  };
}
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale } = await getI18n();
  const store = await cookies();
  const mode =
    store.get("inventory-mode")?.value === "light" ? "light" : "dark";
  const accent =
    store.get("inventory-accent")?.value === "indigo" ? "indigo" : "forest";
  const development = process.env.NODE_ENV === "development";
  const url =
    process.env.KEYCLOAK_URL ?? (development ? "http://localhost:8088" : "");
  const realm =
    process.env.KEYCLOAK_REALM ?? (development ? "inventory-development" : "");
  const clientId = process.env.KEYCLOAK_CLIENT_ID ?? "inventory-web";
  const authConfig =
    url && realm
      ? {
          url,
          realm,
          clientId,
          googleEnabled: process.env.GOOGLE_LOGIN_ENABLED === "true",
          demoEnabled:
            process.env.DEMO_LOGIN_ENABLED === "true" &&
            !!process.env.DEMO_LOGIN_EMAIL &&
            !!process.env.DEMO_LOGIN_PASSWORD &&
            !!process.env.APP_ORIGIN,
        }
      : null;
  return (
    <html lang={locale} data-mode={mode} data-theme={accent}>
      <body>
        <Providers locale={locale} authConfig={authConfig}>
          <AppShell initialMode={mode} initialAccent={accent}>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
