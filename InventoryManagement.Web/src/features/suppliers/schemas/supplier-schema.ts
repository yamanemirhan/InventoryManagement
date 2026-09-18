import { z } from "zod";
import type { Messages } from "@/lib/i18n";
export const createSupplierSchema = (m: Messages) =>
  z.object({
    name: z.string().trim().min(1, m.common.required).max(200),
    email: z.email(m.suppliers.validEmail).max(320),
  });
export type CreateSupplierFormValues = z.infer<
  ReturnType<typeof createSupplierSchema>
>;
