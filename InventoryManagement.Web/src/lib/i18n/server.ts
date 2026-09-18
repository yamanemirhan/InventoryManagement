import "server-only";
import { cookies } from "next/headers";
import { createI18n, resolveLocale } from "./index";
export async function getI18n() {
  return createI18n(
    resolveLocale((await cookies()).get("inventory-locale")?.value),
  );
}
