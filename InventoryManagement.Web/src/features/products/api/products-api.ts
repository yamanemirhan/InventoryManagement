import { apiClient } from "@/lib/api/client";
import type { CreateProductRequest, ProductDto } from "../types/product";

export const productKeys = {
  all: ["products"] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};
export function getProducts(signal?: AbortSignal) {
  return apiClient<ProductDto[]>("/api/products", { signal });
}
export function getProduct(id: string, signal?: AbortSignal) {
  return apiClient<ProductDto>(`/api/products/${id}`, { signal });
}
export function createProduct(request: CreateProductRequest) {
  return apiClient<string>("/api/products", { method: "POST", body: request });
}
