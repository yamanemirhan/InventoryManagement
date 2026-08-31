import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/api-error";

export function applyApiFieldErrors<TFields extends FieldValues>(error: unknown, setError: UseFormSetError<TFields>, fieldMap: Record<string, Path<TFields>>) {
  if (!(error instanceof ApiError) || !error.errors) return false;
  let applied = false;
  for (const [backendField, messages] of Object.entries(error.errors)) {
    const field = fieldMap[backendField.toLowerCase()];
    if (field && messages[0]) {
      setError(field, { type: "server", message: messages[0] });
      applied = true;
    }
  }
  return applied;
}
