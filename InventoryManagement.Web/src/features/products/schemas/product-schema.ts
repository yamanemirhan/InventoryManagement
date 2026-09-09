import { z } from "zod";
import type { Messages } from "@/lib/i18n";
export const createProductSchema = (m: Messages) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, m.common.required)
      .max(200, m.errors.maxName),
    sku: z.string().trim().min(1, m.common.required).max(100, m.errors.maxSku),
  });
export type CreateProductFormValues = z.infer<
  ReturnType<typeof createProductSchema>
>;
