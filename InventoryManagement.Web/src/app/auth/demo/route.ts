import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Bound the cost of this public entry point on the current single frontend instance.
const attempts = new Map<string, { start: number; count: number }>();
let globalWindow = { start: Date.now(), count: 0 };
function allowAttempt(request: Request) {
  const now = Date.now();
  for (const [key, value] of attempts)
    if (now - value.start > 60000) attempts.delete(key);
  if (now - globalWindow.start > 60000)
    globalWindow = { start: now, count: 0 };
  // Nginx overwrites X-Real-IP; never trust a client-supplied X-Forwarded-For chain.
  const key = request.headers.get("x-real-ip") ?? "direct";
  const value = attempts.get(key) ?? { start: now, count: 0 };
  if (value.count >= 4 || globalWindow.count >= 60 || attempts.size >= 1000)
    return false;
  value.count++;
  globalWindow.count++;
  attempts.set(key, value);
  return true;
}

const noStore = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
function failure(status: number) {
  return NextResponse.json(
    { error: "Demo sign-in is unavailable. Please try again shortly." },
    { status, headers: noStore },
  );
}

function decodeAttribute(value: string) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named: Record<string, string> = {
      "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">",
    };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const hex = entity.toLowerCase().startsWith("&#x");
    const code = Number.parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
}

export async function POST(request: Request) {
  const email = process.env.DEMO_LOGIN_EMAIL;
  const password = process.env.DEMO_LOGIN_PASSWORD;
  const appOrigin = process.env.APP_ORIGIN;
  const identityUrl = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.KEYCLOAK_CLIENT_ID ?? "inventory-web";
  if (process.env.DEMO_LOGIN_ENABLED !== "true" || !email || !password || !appOrigin || !identityUrl || !realm)
    return failure(404);
  if (request.headers.get("origin") !== appOrigin ||
      !request.headers.get("content-type")?.startsWith("application/json"))
    return failure(403);
  if (!allowAttempt(request)) {
    const response = failure(429);
    response.headers.set("Retry-After", "60");
    return response;
  }
  try {
    const raw = await request.text();
    if (raw.length > 8192) return failure(400);
    const input: unknown = JSON.parse(raw);
    if (!input || typeof input !== "object" || !("authorizationUrl" in input) || typeof input.authorizationUrl !== "string")
      return failure(400);
    const base = new URL(identityUrl.replace(/\/$/, "") + "/");
    if (base.protocol !== "https:" && process.env.NODE_ENV !== "development")
      return failure(503);
    const authorization = new URL(input.authorizationUrl);
    const realmPath = base.pathname + "realms/" + encodeURIComponent(realm) + "/";
    const callbackUri = new URL("/auth/callback", appOrigin).href;
    const expected = {
      client_id: clientId, redirect_uri: callbackUri, response_type: "code",
      response_mode: "query", code_challenge_method: "S256", prompt: "login",
    };
    if (authorization.origin !== base.origin || authorization.username || authorization.password ||
        authorization.pathname !== realmPath + "protocol/openid-connect/auth" ||
        Object.entries(expected).some(([key, value]) => authorization.searchParams.getAll(key).length !== 1 || authorization.searchParams.get(key) !== value))
      return failure(400);
    const allowed = new Set([...Object.keys(expected), "state", "nonce", "scope", "code_challenge", "ui_locales"]);
    if ([...authorization.searchParams.keys()].some((key) => !allowed.has(key)) ||
        ["state", "nonce", "scope", "code_challenge"].some((key) => authorization.searchParams.getAll(key).length !== 1) ||
        !/^[a-zA-Z0-9_-]{16,128}$/.test(authorization.searchParams.get("state") ?? "") ||
        !/^[a-zA-Z0-9_-]{16,128}$/.test(authorization.searchParams.get("nonce") ?? "") ||
        !/^[a-zA-Z0-9_-]{43}$/.test(authorization.searchParams.get("code_challenge") ?? "") ||
        !authorization.searchParams.get("scope")?.split(" ").includes("openid") ||
        authorization.searchParams.get("scope")?.split(" ").some((scope) => !["openid", "profile", "email"].includes(scope)))
      return failure(400);
    const state = authorization.searchParams.get("state");
    const cookies = new Map<string, string>();
    const setCookies = new Map<string, string>();
    const signal = AbortSignal.timeout(15000);
    const captureCookies = (response: Response) => {
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(";", 1)[0];
        const name = pair.split("=", 1)[0];
        cookies.set(name, pair);
        setCookies.set(name, cookie);
      }
    };
    // Follow only the configured realm. Never forward credentials/cookies to a supplied host.
    let current = authorization;
    let page: Response | undefined;
    for (let i = 0; i < 4; i++) {
      page = await fetch(current, {
        redirect: "manual", cache: "no-store", signal,
        headers: { Accept: "text/html", Cookie: [...cookies.values()].join("; ") },
      });
      captureCookies(page);
      if (page.status === 200) break;
      if (![302, 303].includes(page.status)) return failure(503);
      const location = page.headers.get("location");
      if (!location) return failure(503);
      const next = new URL(location, current);
      if (next.origin !== base.origin || !next.pathname.startsWith(realmPath))
        return failure(503);
      current = next;
    }
    if (!page || page.status !== 200) return failure(503);
    const html = await page.text();
    const form = html.match(/<form\b[^>]*\bid=["']kc-form-login["'][^>]*>[\s\S]*?<\/form>/i)?.[0];
    const action = form?.match(/\baction=["']([^"']+)["']/i)?.[1];
    if (!action) return failure(503);
    const target = new URL(decodeAttribute(action), current);
    if (target.origin !== base.origin || target.username || target.password ||
        target.pathname !== realmPath + "login-actions/authenticate")
      return failure(503);
    const fields = new URLSearchParams({ username: email, password, login: "" });
    for (const input of form!.matchAll(/<input\b[^>]*>/gi)) {
      if (!/\btype=["']hidden["']/i.test(input[0])) continue;
      const name = input[0].match(/\bname=["']([^"']+)["']/i)?.[1];
      const value = input[0].match(/\bvalue=["']([^"']*)["']/i)?.[1] ?? "";
      if (name && !["username", "password"].includes(name))
        fields.set(decodeAttribute(name), decodeAttribute(value));
    }
    const signedIn = await fetch(target, {
      method: "POST", redirect: "manual", cache: "no-store", signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: [...cookies.values()].join("; ") },
      body: fields,
    });
    captureCookies(signedIn);
    const location = signedIn.headers.get("location");
    if (![302, 303].includes(signedIn.status) || !location) return failure(503);
    const callback = new URL(location, target);
    if (callback.origin !== appOrigin || callback.pathname !== "/auth/callback" ||
        callback.searchParams.get("state") !== state || !callback.searchParams.has("code") || callback.searchParams.has("error"))
      return failure(503);
    // The browser still exchanges this one-time code with its original PKCE verifier.
    // Neither the password nor any access/refresh token is returned by this route.
    const response = NextResponse.json({ callbackUrl: callback.href }, { headers: noStore });
    for (const cookie of setCookies.values()) response.headers.append("Set-Cookie", cookie);
    return response;
  } catch {
    // Identity bodies, credentials and authorization URLs must never enter logs/errors.
    return failure(503);
  }
}
