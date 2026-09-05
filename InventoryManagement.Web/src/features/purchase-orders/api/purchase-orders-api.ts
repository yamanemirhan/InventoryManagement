import { apiClient } from "@/lib/api/client";
import type {
  CreatePurchaseOrderRequest,
  PurchaseOrderDto,
  PurchaseOrderPage,
  OrderAction,
} from "../types/purchase-order";
export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  list: (page: number) => ["purchase-orders", "list", page] as const,
  detail: (id: string) => ["purchase-orders", "detail", id] as const,
};
export const getPurchaseOrders = (page: number, signal?: AbortSignal) =>
  apiClient<PurchaseOrderPage>(
    `/api/purchase-orders?page=${page}&pageSize=20`,
    { signal },
  );
export const getPurchaseOrder = (id: string, signal?: AbortSignal) =>
  apiClient<PurchaseOrderDto>(`/api/purchase-orders/${id}`, { signal });
export const createPurchaseOrder = (body: CreatePurchaseOrderRequest) =>
  apiClient<string>("/api/purchase-orders", { method: "POST", body });
export const changeOrderStatus = ({
  id,
  action,
}: {
  id: string;
  action: OrderAction;
  warehouseId: string;
}) =>
  apiClient<void>(`/api/purchase-orders/${id}/${action}`, { method: "POST" });
