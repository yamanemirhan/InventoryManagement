import { z } from "zod";
export const createWarehouseSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(150, "Name cannot exceed 150 characters."),
  location: z.string().trim().min(1, "Location is required.").max(300, "Location cannot exceed 300 characters."),
});
export type CreateWarehouseFormValues = z.infer<typeof createWarehouseSchema>;
