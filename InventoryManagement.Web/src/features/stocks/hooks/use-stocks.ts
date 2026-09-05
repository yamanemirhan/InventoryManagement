"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWarehouseStock,
  getStockHistory,
  increaseStock,
  stockKeys,
  transferStock,
} from "../api/stocks-api";
export const useWarehouseStock = (id: string, enabled = true) =>
  useQuery({
    queryKey: stockKeys.warehouse(id),
    queryFn: ({ signal }) => getWarehouseStock(id, signal),
    enabled: enabled && !!id,
  });
export const useStockHistory = (id: string, page: number) =>
  useQuery({
    queryKey: stockKeys.history(id, page),
    queryFn: ({ signal }) => getStockHistory(id, page, signal),
    enabled: !!id,
  });
export function useIncreaseStock() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: increaseStock,
    onSettled: (_, __, request) =>
      client.invalidateQueries({
        queryKey: stockKeys.warehouse(request.warehouseId),
      }),
  });
}
export function useTransferStock() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: transferStock,
    onSettled: async (_, __, request) => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: stockKeys.warehouse(request.sourceWarehouseId),
        }),
        client.invalidateQueries({
          queryKey: stockKeys.warehouse(request.targetWarehouseId),
        }),
      ]);
    },
  });
}
