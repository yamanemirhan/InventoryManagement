import Link from "next/link";
import {
  ArrowRight,
  ArrowDownToLine,
  ArrowRightLeft,
  ClipboardList,
  Package,
  Warehouse,
  UsersRound,
} from "lucide-react";
import { messages as m } from "@/lib/i18n";
import { LinkButton } from "@/components/ui/link-button";
const areas = [
  {
    href: "/products",
    title: m.nav.products,
    description: m.products.description,
    icon: Package,
  },
  {
    href: "/warehouses",
    title: m.nav.warehouses,
    description: m.warehouses.description,
    icon: Warehouse,
  },
  {
    href: "/suppliers",
    title: m.nav.suppliers,
    description: m.suppliers.description,
    icon: UsersRound,
  },
];
const actions = [
  {
    href: "/stocks/increase",
    title: m.home.receive,
    description: m.home.receiveDescription,
    icon: ArrowDownToLine,
  },
  {
    href: "/stocks/transfer",
    title: m.home.transfer,
    description: m.home.transferDescription,
    icon: ArrowRightLeft,
  },
  {
    href: "/purchase-orders/new",
    title: m.home.purchase,
    description: m.home.purchaseDescription,
    icon: ClipboardList,
  },
];
export default function HomePage() {
  return (
    <>
      <section className="panel relative overflow-hidden px-7 py-12 sm:px-10">
        <div className="relative z-10 max-w-xl">
          <p className="text-[10px] font-semibold tracking-[.18em] text-brand">
            {m.home.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-[44px]">
            {m.home.title}
          </h1>
          <p className="mb-7 mt-5 max-w-lg text-sm leading-7 text-muted">
            {m.home.description}
          </p>
          <LinkButton href="/products">
            {m.home.start}
            <ArrowRight className="size-4" />
          </LinkButton>
        </div>
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-5 hidden size-96 rotate-12 items-center justify-center rounded-[64px] border-[28px] border-brand-soft xl:flex"
        >
          <Package className="size-40 text-brand/15" strokeWidth={0.6} />
        </div>
      </section>
      <div className="grid gap-5 md:grid-cols-3">
        {areas.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="panel group p-6 transition-colors hover:border-brand/40"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="rounded-xl bg-brand-soft p-3">
                <Icon className="size-5 text-brand" strokeWidth={1.6} />
              </div>
              <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-1" />
            </div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          </Link>
        ))}
      </div>
      <section>
        <h2 className="mb-5 text-lg font-semibold tracking-tight">
          {m.home.operations}
        </h2>
        <div className="panel divide-y divide-line">
          {actions.map(({ href, title, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-5 px-6 py-5 transition-colors hover:bg-subtle"
            >
              <Icon className="size-5 shrink-0 text-muted" strokeWidth={1.6} />
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-muted">{description}</p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
