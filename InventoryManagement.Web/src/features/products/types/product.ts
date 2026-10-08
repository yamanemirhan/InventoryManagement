export type ProductDto = { id: string; name: string; sku: string; barcode?: string | null };
export type CreateProductRequest = { name: string; sku: string; barcode?: string | null };
