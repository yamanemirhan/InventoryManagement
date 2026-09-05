import { z } from "zod";
import { messages as m } from "@/lib/i18n";
export const createPurchaseOrderSchema = z
  .object({
    supplierId: z.uuid(m.common.validSupplier),
    warehouseId: z.uuid(m.common.validWarehouse),
    items: z
      .array(
        z.object({
          productId: z.uuid(m.common.validProduct),
          quantity: z
            .number()
            .int(m.common.positiveQuantity)
            .positive(m.common.positiveQuantity)
            .max(2147483647),
          unitPrice: z
            .number()
            .min(0, m.common.validPrice)
            .max(999999999999, m.common.validPrice)
            .refine(
              (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.00001,
              m.common.validPrice,
            ),
        }),
      )
      .min(1, m.orders.oneItem)
      .max(100, m.orders.maxItems),
  })
  .superRefine((values, context) => {
    const seen = new Set<string>();
    values.items.forEach((item, index) => {
      if (seen.has(item.productId))
        context.addIssue({
          code: "custom",
          path: ["items", index, "productId"],
          message: m.orders.uniqueItems,
        });
      seen.add(item.productId);
    });
  });
export type CreatePurchaseOrderFormValues = z.infer<
  typeof createPurchaseOrderSchema
>;
