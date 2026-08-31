"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, House, Package, Warehouse } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const navItems = [{ href: "/", label: "Dashboard", icon: House }, { href: "/products", label: "Products", icon: Package }, { href: "/warehouses", label: "Warehouses", icon: Warehouse }, { href: "/stocks", label: "Stock", icon: Boxes }];
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[248px_1fr]"><aside className="border-b border-slate-200 bg-slate-950 text-white md:min-h-screen md:border-b-0 md:border-r"><div className="flex h-16 items-center gap-3 px-5 md:h-20"><div className="grid size-9 place-items-center rounded-lg bg-white text-slate-950"><Boxes className="size-5" /></div><div><p className="text-sm font-bold">Inventory OS</p><p className="text-xs text-slate-400">Warehouse management</p></div></div><nav aria-label="Primary navigation" className="grid grid-cols-2 gap-1 px-3 pb-3 md:block md:space-y-1 md:pb-0">{navItems.map(({ href, label, icon: Icon }) => { const active = href === "/" ? pathname === "/" : pathname.startsWith(href); return <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium", active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white")}><Icon className="size-4" />{label}</Link>; })}</nav></aside><main className="min-w-0"><div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">{children}</div></main></div>;
}
