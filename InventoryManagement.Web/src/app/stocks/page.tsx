import Link from "next/link";
import { ArrowRightLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { WarehouseStockViewer } from "@/features/stocks/components/warehouse-stock-viewer";
export const metadata = { title: "Warehouse stock" };
export default function StocksPage() { return <><PageHeader title="Warehouse stock" description="Look up current stock by warehouse ID." action={<div className="flex gap-2"><Link href="/stocks/increase" className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:bg-slate-50"><Plus className="mr-2 size-4" />Increase</Link><Link href="/stocks/transfer" className="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"><ArrowRightLeft className="mr-2 size-4" />Transfer</Link></div>} /><WarehouseStockViewer /></>; }
