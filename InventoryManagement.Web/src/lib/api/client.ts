import { ApiError } from "./api-error";
import { getValidationErrors, isProblemDetails } from "./problem-details";
import { messages as m } from "@/lib/i18n";
type ApiClientOptions = Omit<RequestInit, "body"> & { body?: unknown };
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  if (apiBaseUrl === undefined)
    throw new ApiError(m.errors.configuration, 0, "Configuration error");
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      body,
      headers,
    });
  } catch (error) {
    if (
      options.signal?.aborted ||
      (error instanceof DOMException && error.name === "AbortError")
    )
      throw error;
    throw new ApiError(m.errors.network, 0, "Network error");
  }
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError(m.errors.request, response.status, "Invalid response");
    }
  }
  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("json")
    ? await response.json().catch(() => undefined)
    : undefined;
  if (isProblemDetails(payload)) {
    const title =
      typeof payload.title === "string" ? payload.title : m.errors.request;
    const detail =
      typeof payload.detail === "string" ? payload.detail : undefined;
    throw new ApiError(
      detail ?? title,
      response.status,
      title,
      detail,
      getValidationErrors(payload),
    );
  }
  throw new ApiError(
    response.status === 404 ? m.errors.notFound : m.errors.request,
    response.status,
    m.errors.request,
  );
}
