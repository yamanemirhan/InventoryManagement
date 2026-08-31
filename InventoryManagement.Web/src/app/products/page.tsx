import Link from "next/link";
import { Plus } from "lucide-react";
import { ProductsList } from "@/features/products/components/products-list";
import { PageHeader } from "@/components/ui/page-header";
export const metadata = { title: "Products" };
export default function ProductsPage() { return <><PageHeader title="Products" description="Products returned by the inventory API. Soft-deleted records are filtered by the backend." action={<Link href="/products/new" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"><Plus className="mr-2 size-4" />New product</Link>} /><ProductsList /></>; }
