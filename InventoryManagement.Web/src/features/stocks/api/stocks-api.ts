import { apiClient } from "@/lib/api/client";
import type {
  IncreaseStockRequest,
  TransferStockRequest,
  WarehouseStockItemDto,
  StockMovementDto,
} from "../types/stock";
export const stockKeys = {
  all: ["stocks"] as const,
  warehouse: (id: string) => ["stocks", "warehouse", id] as const,
  history: (id: string, page: number) =>
    ["stocks", "warehouse", id, "history", page] as const,
};
export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};
export const getWarehouseStock = (id: string, signal?: AbortSignal) =>
  apiClient<WarehouseStockItemDto[]>(`/api/stocks/warehouse/${id}`, { signal });
export const getStockHistory = (
  id: string,
  page: number,
  signal?: AbortSignal,
) =>
  apiClient<PagedResult<StockMovementDto>>(
    `/api/stocks/warehouse/${id}/history/page?page=${page}&pageSize=20`,
    { signal },
  );
export const increaseStock = (body: IncreaseStockRequest) =>
  apiClient<void>("/api/stocks/increase", { method: "POST", body });
export const transferStock = (body: TransferStockRequest) =>
  apiClient<void>("/api/stocks/transfer", { method: "POST", body });
