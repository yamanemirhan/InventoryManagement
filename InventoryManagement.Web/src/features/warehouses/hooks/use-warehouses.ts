"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  warehouseKeys,
} from "../api/warehouses-api";
export const useWarehouses = () =>
  useQuery({
    queryKey: warehouseKeys.all,
    queryFn: ({ signal }) => getWarehouses(signal),
  });
export const useWarehouse = (id: string) =>
  useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: ({ signal }) => getWarehouse(id, signal),
  });
export function useCreateWarehouse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => client.invalidateQueries({ queryKey: warehouseKeys.all }),
  });
}
