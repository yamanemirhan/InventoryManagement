export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly title: string,
    public readonly detail?: string,
    public readonly errors?: Record<string, string[]>,
    public readonly code?: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isConcurrencyConflict() {
    return (
      this.status === 409 &&
      (this.code === "concurrency_conflict" ||
        this.title.toLowerCase().includes("concurrency"))
    );
  }
}
