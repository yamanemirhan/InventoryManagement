"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWarehouseStock, increaseStock, stockKeys, transferStock } from "../api/stocks-api";

export function useWarehouseStock(warehouseId: string, enabled: boolean) { return useQuery({ queryKey: stockKeys.warehouse(warehouseId), queryFn: ({ signal }) => getWarehouseStock(warehouseId, signal), enabled }); }
export function useIncreaseStock() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: increaseStock, onSuccess: (_, request) => queryClient.invalidateQueries({ queryKey: stockKeys.warehouse(request.warehouseId) }) });
}
export function useTransferStock() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: transferStock, onSuccess: async (_, request) => { await Promise.all([queryClient.invalidateQueries({ queryKey: stockKeys.warehouse(request.sourceWarehouseId) }), queryClient.invalidateQueries({ queryKey: stockKeys.warehouse(request.targetWarehouseId) })]); } });
}
