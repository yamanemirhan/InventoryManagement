import { apiClient } from "@/lib/api/client";
import type { SupplierDto, CreateSupplierRequest } from "../types/supplier";
export const supplierKeys = {
  all: ["suppliers"] as const,
  detail: (id: string) => ["suppliers", "detail", id] as const,
};
export const getSuppliers = (signal?: AbortSignal) =>
  apiClient<SupplierDto[]>("/api/suppliers", { signal });
export const getSupplier = (id: string, signal?: AbortSignal) =>
  apiClient<SupplierDto>(`/api/suppliers/${id}`, { signal });
export const createSupplier = (body: CreateSupplierRequest) =>
  apiClient<string>("/api/suppliers", { method: "POST", body });
