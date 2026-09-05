import { z } from "zod";
import { messages as m } from "@/lib/i18n";
const quantity = z
  .number()
  .int(m.common.positiveQuantity)
  .positive(m.common.positiveQuantity)
  .max(2147483647);
export const increaseStockSchema = z.object({
  productId: z.uuid(m.common.validProduct),
  warehouseId: z.uuid(m.common.validWarehouse),
  quantity,
});
export const transferStockSchema = z
  .object({
    productId: z.uuid(m.common.validProduct),
    sourceWarehouseId: z.uuid(m.common.validWarehouse),
    targetWarehouseId: z.uuid(m.common.validWarehouse),
    quantity,
  })
  .refine((v) => v.sourceWarehouseId !== v.targetWarehouseId, {
    path: ["targetWarehouseId"],
    message: m.stocks.different,
  });
export type IncreaseStockFormValues = z.infer<typeof increaseStockSchema>;
export type TransferStockFormValues = z.infer<typeof transferStockSchema>;
