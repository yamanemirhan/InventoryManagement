"use client";
import { useMutation } from "@tanstack/react-query";
import { createWarehouse } from "../api/warehouses-api";
export function useCreateWarehouse() { return useMutation({ mutationFn: createWarehouse }); }
