import { z } from "zod";
import { messages as m } from "@/lib/i18n";
export const createProductSchema = z.object({
  name: z.string().trim().min(1, m.common.required).max(200, m.errors.maxName),
  sku: z.string().trim().min(1, m.common.required).max(100, m.errors.maxSku),
});
export type CreateProductFormValues = z.infer<typeof createProductSchema>;
