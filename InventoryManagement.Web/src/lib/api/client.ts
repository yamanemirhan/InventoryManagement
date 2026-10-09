import { getAccessToken, expireSession } from "@/features/auth/lib/keycloak";
import { ApiError } from "./api-error";
import { getValidationErrors, isProblemDetails } from "./problem-details";
import { getClientI18n } from "@/lib/i18n";
type ApiClientOptions = Omit<RequestInit, "body"> & { body?: unknown };
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { m, locale } = getClientI18n();

  if (apiBaseUrl === undefined)
    throw new ApiError(m.errors.configuration, 0, "Configuration error");
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Accept-Language", locale);
  const companyId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("inventory-company")
      : null;
  if (companyId) headers.set("X-Company-Id", companyId);
  const token = await getAccessToken();
  if (!token)
    throw new ApiError(m.auth.sessionExpired, 401, m.auth.sessionExpired);
  headers.set("Authorization", `Bearer ${token}`);
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
  if (response.status === 401) {
    expireSession();
    throw new ApiError(m.auth.sessionExpired, 401, m.auth.sessionExpired);
  }
  if (response.status === 403)
    throw new ApiError(m.auth.forbiddenDescription, 403, m.auth.forbidden);
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
      typeof payload.code === "string" ? payload.code : undefined,
      response.status === 429 ? Math.min(86400, Math.max(1, Number(response.headers.get("Retry-After")) || 60)) : undefined,
    );
  }
  throw new ApiError(
    response.status === 404 ? m.errors.notFound : m.errors.request,
    response.status,
    m.errors.request,
  );
}
