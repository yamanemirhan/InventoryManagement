import { apiClient } from "@/lib/api/client";
import type { CreateWarehouseRequest } from "../types/warehouse";
export function createWarehouse(request: CreateWarehouseRequest) { return apiClient<string>("/api/warehouses", { method: "POST", body: request }); }
