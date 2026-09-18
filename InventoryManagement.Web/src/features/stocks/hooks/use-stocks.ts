"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStockOverview,
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
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
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
    onSettled: () =>
      client.invalidateQueries({
        queryKey: stockKeys.all,
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

export const useStockOverview = (enabled = true) =>
  useQuery({
    queryKey: [...stockKeys.all, "overview"],
    queryFn: ({ signal }) => getStockOverview(signal),
    enabled,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });
