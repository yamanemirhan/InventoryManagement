"use client";
import Link from "next/link";
import {
  CompanySwitcher,
  useCompany,
  useCompanyText,
} from "@/features/companies/company-provider";
import { Preferences } from "./preferences";
import { AssistantWidget } from "@/features/assistant/assistant-widget";
import { NotificationCenter } from "@/features/realtime/realtime-provider";
import { useAuth } from "@/features/auth/components/auth-provider";
import { AuthGate } from "@/features/auth/components/auth-gate";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Package,
  Warehouse,
  UsersRound,
  ClipboardList,
  ArrowUpRight,
  Menu,
  X,
  ChevronRight,
  PanelTop,
  BookOpen,
  History,
  ScanLine,
} from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarOpen } from "@/store/slices/inventory-ui-slice";

export function AppShell({
  children,
  initialMode,
  initialAccent,
}: {
  children: ReactNode;
  initialMode: "dark" | "light";
  initialAccent: "forest" | "indigo";
}) {
  const auth = useAuth();
  const { company } = useCompany();
  const t = useCompanyText();
  const { m } = useI18n();
  const nav = [
    { href: "/", label: m.app.overview, icon: PanelTop },
    { href: "/products", label: m.nav.products, icon: Package },
    { href: "/warehouses", label: m.nav.warehouses, icon: Warehouse },
    { href: "/stocks", label: m.nav.stocks, icon: Boxes },
    { href: "/scan", label: t("QR / barkod okut", "Scan QR / barcode"), icon: ScanLine },
    { href: "/suppliers", label: m.nav.suppliers, icon: UsersRound },
    { href: "/purchase-orders", label: m.nav.orders, icon: ClipboardList },
  ];

  nav.push({
    href: "/reports",
    label: t("Raporlar ve sayım", "Reports & counts"),
    icon: ClipboardList,
  });
  nav.push({
    href: "/knowledge",
    label: t("Bilgi kaynakları", "Knowledge resources"),
    icon: BookOpen,
  });
  if (company && ["Owner", "Manager"].includes(company.role))
    nav.push({ href: "/imports", label: t("Toplu veri aktarımı", "Bulk data import"), icon: ArrowUpRight });
  if (company && ["Owner", "Manager"].includes(company.role))
    nav.push({
      href: "/activity",
      label: t("İşlem geçmişi", "Activity history"),
      icon: History,
    });
  nav.push({
    href: "/companies",
    label: t("Şirket ve ekip", "Company & team"),
    icon: UsersRound,
  });
  if (auth.admin)
    nav.push({
      href: "/admin",
      label: t("Platform yönetimi", "Platform administration"),
      icon: PanelTop,
    });
  if (auth.admin)
    nav.push({ href: "/admin/monitoring", label: t("Sistem izleme", "System monitoring"), icon: History });
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.inventoryUi.sidebarOpen);
  const current =
    pathname === "/account"
      ? { href: "/account", label: m.auth.account }
      : (nav.filter((n) => n.href !== "/" && pathname.startsWith(n.href)).sort((a, b) => b.href.length - a.href.length)[0] ?? nav[0]);
  if (auth.status !== "authenticated") {
    return (
      <div className="flex min-h-screen flex-col bg-subtle">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface px-5 py-5 sm:px-10">
          <Link
            href="/"
            className="flex items-center gap-3 font-semibold tracking-tight"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
              <Boxes className="size-6" strokeWidth={1.5} />
            </span>
            {m.app.name}
          </Link>
          <Preferences
            initialMode={initialMode}
            initialAccent={initialAccent}
          />
        </header>
        <main
          id="main-content"
          className="flex flex-1 items-center justify-center px-5 py-10"
        >
          <div className="w-full max-w-md">
            <AuthGate>{children}</AuthGate>
          </div>
        </main>
        <footer className="pb-6 text-center text-xs text-muted">
          {t(
            "Şirketinizin envanteri, tek bir yerde.",
            "Your company’s inventory, all in one place.",
          )}
        </footer>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded bg-surface p-3 focus:translate-y-0"
      >
        {m.app.skip}
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] flex-col overflow-y-auto bg-sidebar px-4 text-on-brand lg:flex">
        <Link href="/" className="flex items-center gap-3 px-3 py-9">
          <div className="grid size-10 place-items-center rounded-xl border border-sidebar-muted/25">
            <Boxes className="size-6" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[17px] font-semibold tracking-tight">
              {m.app.name}
            </p>
            <p className="mt-0.5 text-[10px] text-sidebar-muted">
              {m.app.tagline}
            </p>
          </div>
        </Link>
        <p className="px-4 pb-4 pt-8 text-[9px] font-semibold tracking-[.17em] text-sidebar-muted">
          {m.app.catalog}
        </p>
        <nav aria-label={m.app.navigation} className="space-y-1.5">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={current.href === href ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-[13px] transition-colors",
                current.href === href
                  ? "bg-sidebar-active font-medium text-on-brand"
                  : "text-sidebar-muted hover:bg-sidebar-active/50 hover:text-on-brand",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.7} />
              {label}
              {current.href === href && (
                <span className="ml-auto size-1.5 rounded-full bg-on-brand/80" />
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-4 pb-7">
          <div className="mb-6 border-t border-sidebar-muted/15" />
          <p className="text-xs text-sidebar-muted">
            {auth.status === "authenticated" ? auth.name : m.app.footer}
          </p>
          {auth.status === "authenticated" && (
            <div className="mt-4 space-y-2 text-xs">
              <p className="text-sidebar-muted">
                {auth.admin
                  ? t("Platform yöneticisi", "Platform admin")
                  : (company?.role ?? m.auth.user)}
              </p>
              <button
                className="block text-on-brand"
                onClick={() => auth.account()}
              >
                {m.auth.account}
              </button>
              <button
                className="block text-on-brand"
                onClick={() => auth.logout()}
              >
                {m.auth.logout}
              </button>
            </div>
          )}
          <p className="mt-2 flex items-center gap-2 text-[10px] text-sidebar-muted/60">
            INVENTORY OS <ArrowUpRight className="size-3" />
          </p>
        </div>
      </aside>
      <div className="lg:pl-[244px]">
        <header className="flex h-[76px] items-center justify-between gap-3 border-b border-line bg-surface px-5 sm:px-9">
          <div className="flex min-w-0 items-center gap-3 text-xs">
            <button
              aria-label={m.app.menu}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => dispatch(setSidebarOpen(!open))}
              className="rounded p-2 lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <span className="hidden text-muted sm:inline">
              {m.app.workspace}
            </span>
            <ChevronRight className="hidden size-3 text-muted sm:inline" />
            <span className="truncate font-medium">{current.label}</span>
          </div>
          <CompanySwitcher />
          <NotificationCenter />
          <Preferences
            initialMode={initialMode}
            initialAccent={initialAccent}
          />
        </header>
        {open && (
          <nav
            id="mobile-nav"
            aria-label={m.app.navigation}
            className="grid grid-cols-2 gap-2 border-b border-line bg-surface p-4 lg:hidden"
          >
            {auth.status === "authenticated" && (
              <div className="col-span-2 flex gap-4 p-3 text-sm">
                <button onClick={() => auth.account()}>{m.auth.account}</button>
                <button onClick={() => auth.logout()}>{m.auth.logout}</button>
              </div>
            )}
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => dispatch(setSidebarOpen(false))}
                aria-current={current.href === n.href ? "page" : undefined}
                className={cn(
                  "rounded-lg p-3 text-sm",
                  current.href === n.href
                    ? "bg-brand-soft text-brand"
                    : "text-muted",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
        <main
          id="main-content"
          className="mx-auto max-w-[1440px] space-y-7 px-5 py-8 sm:px-9 sm:py-10"
        >
          <AuthGate>{children}</AuthGate>
        </main>
        <AssistantWidget />
      </div>
    </div>
  );
}
