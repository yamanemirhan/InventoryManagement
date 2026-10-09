export type AssistantSource = { key: string; kind: string; id: string; title: string; excerpt: string; href: string; revision?: number };
export type AssistantReply = { text: string; truncated: boolean; sources?: AssistantSource[]; mode: "local" | "cloud"; noticeCode?: string; retryAfterSeconds: number; retrievedAtUtc?: string };
export type AssistantConfiguration = { available: boolean; name: string; provider: string; model: string; cloudAvailable: boolean; companyCloudAvailable: boolean; maxMessageLength: number };
export type AssistantInsight = { id: string; severity: "critical" | "warning" | "info"; title: string; detail: string; href: string; question: string };
export type AssistantInsights = { retrievedAtUtc: string; items: AssistantInsight[] };
export function pageContext(path: string) {
  if (path === "/") return "overview";
  if (path === "/stocks/increase") return "stock-receipt";
  if (path === "/stocks/transfer") return "stock-transfer";
  if (path.startsWith("/purchase-orders")) return "purchases";
  return ["products", "warehouses", "stocks", "suppliers", "reports", "imports", "scan", "companies", "knowledge"].find(page => path === `/${page}` || path.startsWith(`/${page}/`)) ?? "other";
}
export function openInvo(companyId: string, question: string) {
  window.dispatchEvent(new CustomEvent("invo-question", { detail: { companyId, question } }));
}
