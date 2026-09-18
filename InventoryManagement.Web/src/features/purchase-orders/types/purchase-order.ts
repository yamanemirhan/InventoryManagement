export type PurchaseOrderStatus = 1 | 2 | 3 | 4 | 5;
export type PurchaseOrderItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};
export type CreatePurchaseOrderRequest = {
  supplierId: string;
  warehouseId: string;
  items: PurchaseOrderItemInput[];
};
export type PurchaseOrderListItemDto = {
  id: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  status: PurchaseOrderStatus;
  createdAtUtc: string;
  itemCount: number;
  totalAmount: number;
};
export type PurchaseOrderItemDto = PurchaseOrderItemInput & {
  productName: string;
  sku: string;
  totalPrice: number;
  receivedQuantity: number;
  returnedQuantity: number;
};
export type PurchaseOrderDto = Omit<PurchaseOrderListItemDto, "itemCount"> & {
  items: PurchaseOrderItemDto[];
  version: number;
};
export type OrderAction = "order" | "receive" | "cancel";
export type PurchaseOrderPage = {
  items: PurchaseOrderListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
};
