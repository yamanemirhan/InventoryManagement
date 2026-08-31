export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly title: string,
    public readonly detail?: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isConcurrencyConflict() {
    return this.status === 409 && this.title.toLowerCase().includes("concurrency");
  }
}
