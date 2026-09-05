"use client";
import Link from "next/link";
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
  Palette,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { messages as m } from "@/lib/i18n";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarOpen } from "@/store/slices/inventory-ui-slice";
const nav = [
  { href: "/", label: m.app.overview, icon: PanelTop },
  { href: "/products", label: m.nav.products, icon: Package },
  { href: "/warehouses", label: m.nav.warehouses, icon: Warehouse },
  { href: "/stocks", label: m.nav.stocks, icon: Boxes },
  { href: "/suppliers", label: m.nav.suppliers, icon: UsersRound },
  { href: "/purchase-orders", label: m.nav.orders, icon: ClipboardList },
];
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.inventoryUi.sidebarOpen);
  const [theme, setTheme] = useState("forest");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("inventory-theme");
      if (saved === "indigo") document.documentElement.dataset.theme = saved;
    } catch {}
  }, []);
  const changeTheme = () => {
    const next =
      document.documentElement.dataset.theme === "indigo" ? "forest" : "indigo";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("inventory-theme", next);
    } catch {}
  };
  const current =
    nav.find((n) => n.href !== "/" && pathname.startsWith(n.href)) ?? nav[0];
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded bg-surface p-3 focus:translate-y-0"
      >
        {m.app.skip}
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] flex-col bg-sidebar px-4 text-on-brand lg:flex">
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
          <p className="text-xs text-sidebar-muted">{m.app.footer}</p>
          <p className="mt-2 flex items-center gap-2 text-[10px] text-sidebar-muted/60">
            INVENTORY OS <ArrowUpRight className="size-3" />
          </p>
        </div>
      </aside>
      <div className="lg:pl-[244px]">
        <header className="flex h-[76px] items-center justify-between border-b border-line bg-surface px-5 sm:px-9">
          <div className="flex items-center gap-3 text-xs">
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
            <span className="font-medium">{current.label}</span>
          </div>
          <button
            type="button"
            onClick={changeTheme}
            aria-label={m.app.theme}
            title={m.app.theme}
            data-current-theme={theme}
            className="flex size-9 items-center justify-center rounded-full border border-line text-muted hover:text-brand"
          >
            <Palette className="size-4" />
          </button>
        </header>
        {open && (
          <nav
            id="mobile-nav"
            aria-label={m.app.navigation}
            className="grid grid-cols-2 gap-2 border-b border-line bg-surface p-4 lg:hidden"
          >
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
          {children}
        </main>
      </div>
    </div>
  );
}
