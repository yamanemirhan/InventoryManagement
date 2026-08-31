import { apiClient } from "@/lib/api/client";
import type { IncreaseStockRequest, TransferStockRequest, WarehouseStockItemDto } from "../types/stock";

export const stockKeys = { all: ["stocks"] as const, warehouse: (warehouseId: string) => ["stocks", "warehouse", warehouseId] as const };
export function getWarehouseStock(warehouseId: string, signal?: AbortSignal) { return apiClient<WarehouseStockItemDto[]>(`/api/stocks/warehouse/${warehouseId}`, { signal }); }
export function increaseStock(request: IncreaseStockRequest) { return apiClient<void>("/api/stocks/increase", { method: "POST", body: request }); }
export function transferStock(request: TransferStockRequest) { return apiClient<void>("/api/stocks/transfer", { method: "POST", body: request }); }
