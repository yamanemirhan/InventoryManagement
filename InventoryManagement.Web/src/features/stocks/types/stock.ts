export type WarehouseStockItemDto = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
};
export type IncreaseStockRequest = {
  productId: string;
  warehouseId: string;
  quantity: number;
};
export type TransferStockRequest = {
  productId: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  quantity: number;
};
export type StockMovementDto = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 1 | 2 | 3 | 4;
  quantity: number;
  warehouseId: string;
  relatedWarehouseId: string | null;
  createdAtUtc: string;
};
