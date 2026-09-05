import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "./providers";
import { messages as m, locale } from "@/lib/i18n";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: m.app.name, template: "%s | " + m.app.name },
  description: m.home.description,
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={locale}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
