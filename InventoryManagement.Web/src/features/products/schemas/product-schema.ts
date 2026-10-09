import { z } from "zod";
import type { Messages } from "@/lib/i18n";
export const createProductSchema = (m: Messages, barcodeError: string) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, m.common.required)
      .max(200, m.errors.maxName),
    sku: z.string().trim().min(1, m.common.required).max(100, m.errors.maxSku),
    barcode: z.string().trim().max(100, barcodeError).regex(/^[!-~]*$/, barcodeError)
      .refine(value => !value.toLowerCase().startsWith("inventory:"), barcodeError),
  });
export type CreateProductFormValues = z.infer<
  ReturnType<typeof createProductSchema>
>;
