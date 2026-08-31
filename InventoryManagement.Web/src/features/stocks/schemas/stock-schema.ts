import { z } from "zod";

const uuidMessage = "Enter a valid warehouse or product UUID.";
export const warehouseLookupSchema = z.object({ warehouseId: z.uuid(uuidMessage) });
export const increaseStockSchema = z.object({
  productId: z.uuid("Select a valid product."),
  warehouseId: z.uuid("Enter a valid warehouse UUID."),
  quantity: z.number().int("Quantity must be a whole number.").positive("Quantity must be greater than zero."),
});
export const transferStockSchema = z.object({
  productId: z.uuid("Select a valid product."),
  sourceWarehouseId: z.uuid("Enter a valid source warehouse UUID."),
  targetWarehouseId: z.uuid("Enter a valid target warehouse UUID."),
  quantity: z.number().int("Quantity must be a whole number.").positive("Quantity must be greater than zero."),
}).refine((value) => value.sourceWarehouseId !== value.targetWarehouseId, { path: ["targetWarehouseId"], message: "Target warehouse must be different from source warehouse." });

export type WarehouseLookupFormValues = z.infer<typeof warehouseLookupSchema>;
export type IncreaseStockFormValues = z.infer<typeof increaseStockSchema>;
export type TransferStockFormValues = z.infer<typeof transferStockSchema>;
