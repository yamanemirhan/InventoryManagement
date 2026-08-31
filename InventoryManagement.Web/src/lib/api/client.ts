import { ApiError } from "./api-error";
import { getValidationErrors, isProblemDetails } from "./problem-details";

type ApiClientOptions = Omit<RequestInit, "body"> & { body?: unknown };
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export async function apiClient<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  if (!apiBaseUrl) throw new ApiError("API address is not configured. Set NEXT_PUBLIC_API_BASE_URL.", 0, "Configuration error");

  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...options, body, headers });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("The API could not be reached. Check that the backend is running.", 0, "Network error");
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("json") ? await response.json().catch(() => undefined) : undefined;
  if (isProblemDetails(payload)) {
    const title = typeof payload.title === "string" ? payload.title : "Request failed";
    const detail = typeof payload.detail === "string" ? payload.detail : undefined;
    throw new ApiError(detail ?? title, response.status, title, detail, getValidationErrors(payload));
  }
  throw new ApiError(`Request failed with status ${response.status}.`, response.status, "Request failed");
}
