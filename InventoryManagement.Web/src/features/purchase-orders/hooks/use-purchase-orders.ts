"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  purchaseOrderKeys,
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  changeOrderStatus,
} from "../api/purchase-orders-api";
import { stockKeys } from "@/features/stocks/api/stocks-api";
export const usePurchaseOrders = (page: number) =>
  useQuery({
    queryKey: purchaseOrderKeys.list(page),
    queryFn: ({ signal }) => getPurchaseOrders(page, signal),
  });
export const usePurchaseOrder = (id: string) =>
  useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: ({ signal }) => getPurchaseOrder(id, signal),
  });
export function useCreatePurchaseOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
}
export function useOrderAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: changeOrderStatus,
    onSettled: async (_, __, variables) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
        client.invalidateQueries({
          queryKey: stockKeys.warehouse(variables.warehouseId),
        }),
      ]);
    },
  });
}
