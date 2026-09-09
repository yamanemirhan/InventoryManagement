import { getClientI18n } from "@/lib/i18n";
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getErrorMessage(error: unknown) {
  const { m } = getClientI18n();

  if (error instanceof Error) return error.message;
  return m.common.unknownError;
}
