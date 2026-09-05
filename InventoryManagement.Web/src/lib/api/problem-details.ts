export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
};
export type ValidationProblemDetails = ProblemDetails & {
  errors: Record<string, string[]>;
};

export function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === "object" && value !== null;
}

export function getValidationErrors(value: unknown) {
  if (!isProblemDetails(value) || !("errors" in value)) return undefined;
  const errors = value.errors;
  if (typeof errors !== "object" || errors === null) return undefined;
  const entries = Object.entries(errors).filter(
    (entry): entry is [string, string[]] =>
      Array.isArray(entry[1]) &&
      entry[1].every((message) => typeof message === "string"),
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}
