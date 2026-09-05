import { apiClient } from "@/lib/api/client";
import type { CreateWarehouseRequest, WarehouseDto } from "../types/warehouse";
export const warehouseKeys = {
  all: ["warehouses"] as const,
  detail: (id: string) => ["warehouses", "detail", id] as const,
};
export const getWarehouses = (signal?: AbortSignal) =>
  apiClient<WarehouseDto[]>("/api/warehouses", { signal });
export const getWarehouse = (id: string, signal?: AbortSignal) =>
  apiClient<WarehouseDto>(`/api/warehouses/${id}`, { signal });
export const createWarehouse = (body: CreateWarehouseRequest) =>
  apiClient<string>("/api/warehouses", { method: "POST", body });
