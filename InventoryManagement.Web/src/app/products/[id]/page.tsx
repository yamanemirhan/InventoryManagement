import { ProductDetail } from "@/features/products/components/product-detail";
import { PageHeader } from "@/components/ui/page-header";
export const metadata = { title: "Product details" };
export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <><PageHeader title="Product details" description="Catalog identity and API contract fields for this product." /><ProductDetail id={id} /></>; }
