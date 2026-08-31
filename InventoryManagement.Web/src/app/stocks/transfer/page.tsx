import { PageHeader } from "@/components/ui/page-header";
import { TransferStockForm } from "@/features/stocks/components/transfer-stock-form";
export const metadata = { title: "Transfer stock" };
export default function TransferStockPage() { return <><PageHeader title="Transfer stock" description="Move available product quantity between two different warehouses." /><TransferStockForm /></>; }
