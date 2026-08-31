import Link from "next/link";
import { Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
export const metadata = { title: "Warehouses" };
export default function WarehousesPage() { return <><PageHeader title="Warehouses" description="Create warehouse records for stock operations." action={<Link href="/warehouses/new" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"><Plus className="mr-2 size-4" />New warehouse</Link>} /><Alert title="Warehouse list is not available"><p>The backend does not currently expose a warehouse listing endpoint. Created warehouse IDs can be used directly in stock screens.</p><p className="mt-2 text-xs">TODO: Add a list when a supported GET endpoint is introduced.</p></Alert></>; }
