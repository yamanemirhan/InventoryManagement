import { CreateProductForm } from "@/features/products/components/create-product-form";
import { PageHeader } from "@/components/ui/page-header";
export const metadata = { title: "New product" };
export default function NewProductPage() { return <><PageHeader title="Create product" description="Add a product with a unique name and SKU. The backend remains authoritative for validation." /><CreateProductForm /></>; }
