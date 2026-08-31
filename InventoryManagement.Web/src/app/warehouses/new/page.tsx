import { PageHeader } from "@/components/ui/page-header";
import { CreateWarehouseForm } from "@/features/warehouses/components/create-warehouse-form";
export const metadata = { title: "New warehouse" };
export default function NewWarehousePage() { return <><PageHeader title="Create warehouse" description="Create a location and keep the returned ID for stock operations." /><CreateWarehouseForm /></>; }
