export type WarehouseStockItemDto = { productId: string; productName: string; sku: string; quantity: number };
export type IncreaseStockRequest = { productId: string; warehouseId: string; quantity: number };
export type TransferStockRequest = { productId: string; sourceWarehouseId: string; targetWarehouseId: string; quantity: number };
