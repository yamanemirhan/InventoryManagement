import { z } from "zod";
import { messages as m } from "@/lib/i18n";
export const createWarehouseSchema = z.object({
  name: z.string().trim().min(1, m.common.required).max(150, m.errors.maxName),
  location: z
    .string()
    .trim()
    .min(1, m.common.required)
    .max(300, m.errors.maxLocation),
});
export type CreateWarehouseFormValues = z.infer<typeof createWarehouseSchema>;
