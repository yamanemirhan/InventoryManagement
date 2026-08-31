import { z } from "zod";
export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200, "Name cannot exceed 200 characters."),
  sku: z.string().trim().min(1, "SKU is required.").max(100, "SKU cannot exceed 100 characters."),
});
export type CreateProductFormValues = z.infer<typeof createProductSchema>;
