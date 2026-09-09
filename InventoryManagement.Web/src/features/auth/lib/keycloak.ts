import Keycloak from "keycloak-js";
import type { AuthConfig } from "../types/auth";

let client: Keycloak | undefined;
let initialization: Promise<Keycloak> | undefined;
let refresh: Promise<boolean> | undefined;
export const sessionEvent = "inventory-session-changed";

export function initializeAuth(config: AuthConfig): Promise<Keycloak> {
  if (initialization) return initialization;
  if (!window.location.pathname.startsWith("/auth"))
    sessionStorage.setItem(
      "inventory-return",
      safeReturnPath(window.location.pathname + window.location.search),
    );
  client = new Keycloak({
    url: config.url,
    realm: config.realm,
    clientId: config.clientId,
  });
  const instance = client;
  const changed = () => window.dispatchEvent(new Event(sessionEvent));
  instance.onAuthLogout = changed;
  instance.onAuthRefreshSuccess = changed;
  instance.onAuthRefreshError = () => {
    instance.clearToken();
    changed();
  };
  instance.onTokenExpired = () => {
    void getAccessToken().catch(() => instance.clearToken());
  };
  initialization = instance
    .init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      flow: "standard",
      checkLoginIframe: false,
      responseMode: "query",
      redirectUri: window.location.origin + "/auth/callback",
      enableLogging: false,
    })
    .then(() => instance);
  return initialization;
}
export async function getAccessToken(): Promise<string | undefined> {
  if (!client?.authenticated) return undefined;
  if (!refresh)
    refresh = client.updateToken(45).finally(() => {
      refresh = undefined;
    });
  try {
    await refresh;
    return client.token;
  } catch {
    client.clearToken();
    window.dispatchEvent(new Event(sessionEvent));
    return undefined;
  }
}
export function expireSession() {
  client?.clearToken();
  window.dispatchEvent(new Event(sessionEvent));
}
export function safeReturnPath(value: string | null) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.startsWith("/auth")
    ? value
    : "/";
}
