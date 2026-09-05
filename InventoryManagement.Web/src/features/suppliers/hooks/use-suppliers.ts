"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  supplierKeys,
} from "../api/suppliers-api";
export const useSuppliers = () =>
  useQuery({
    queryKey: supplierKeys.all,
    queryFn: ({ signal }) => getSuppliers(signal),
  });
export const useSupplier = (id: string) =>
  useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: ({ signal }) => getSupplier(id, signal),
  });
export function useCreateSupplier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => client.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}
