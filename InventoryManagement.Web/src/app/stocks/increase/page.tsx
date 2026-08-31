import { PageHeader } from "@/components/ui/page-header";
import { IncreaseStockForm } from "@/features/stocks/components/increase-stock-form";
export const metadata = { title: "Increase stock" };
export default function IncreaseStockPage() { return <><PageHeader title="Increase stock" description="Add a positive quantity of a product to a warehouse." /><IncreaseStockForm /></>; }
