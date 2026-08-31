export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}
