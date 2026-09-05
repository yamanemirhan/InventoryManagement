"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  getProduct,
  getProducts,
  productKeys,
} from "../api/products-api";

export function useProducts() {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: ({ signal }) => getProducts(signal),
  });
}
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) => getProduct(id, signal),
    enabled: id.length > 0,
  });
}
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}
