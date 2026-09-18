import { z } from "zod";
import type { Messages } from "@/lib/i18n";
const quantity = (m: Messages) =>
  z
    .number({ error: m.common.positiveQuantity })
    .int(m.common.positiveQuantity)
    .positive(m.common.positiveQuantity)
    .max(2147483647, m.common.positiveQuantity);
export const increaseStockSchema = (m: Messages) =>
  z.object({
    productId: z.uuid(m.common.validProduct),
    warehouseId: z.uuid(m.common.validWarehouse),
    quantity: quantity(m),
  });
export const transferStockSchema = (m: Messages) =>
  z
    .object({
      productId: z.uuid(m.common.validProduct),
      sourceWarehouseId: z.uuid(m.common.validWarehouse),
      targetWarehouseId: z.uuid(m.common.validWarehouse),
      quantity: quantity(m),
    })
    .refine((v) => v.sourceWarehouseId !== v.targetWarehouseId, {
      path: ["targetWarehouseId"],
      message: m.stocks.different,
    });
export type IncreaseStockFormValues = z.infer<
  ReturnType<typeof increaseStockSchema>
>;
export type TransferStockFormValues = z.infer<
  ReturnType<typeof transferStockSchema>
>;
