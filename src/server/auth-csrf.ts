import { StartAuthJS } from "start-authjs";

import { authConfig } from "@/lib/auth0-config";

const authHandlers = StartAuthJS(authConfig);

export function appAuthBaseUrl(request: Request): string {
  const configured =
    process.env.APP_BASE_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/api\/auth\/?$/, "") ||
    "";
  if (configured.startsWith("http")) return configured;
  return new URL(request.url).origin;
}

export function forwardSetCookies(from: Response, to: Headers) {
  if (typeof from.headers.getSetCookie === "function") {
    for (const cookie of from.headers.getSetCookie()) {
      to.append("Set-Cookie", cookie);
    }
    return;
  }
  const raw = from.headers.get("set-cookie");
  if (raw) to.append("Set-Cookie", raw);
}

export function escapeHtmlAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Fetch Auth.js CSRF using the same canonical origin Auth.js uses for
 * sign-in/sign-out (APP_BASE_URL). Without this, production logout issues a
 * non-__Host__ cookie while POST /api/auth/signout expects __Host-authjs.csrf-token.
 */
export async function fetchAuthCsrfToken(request: Request): Promise<{
  base: string;
  csrfToken: string;
  csrfResponse: Response;
}> {
  const base = appAuthBaseUrl(request);
  const baseUrl = new URL(base);
  const csrfUrl = new URL("/api/auth/csrf", base);

  const headers = new Headers(request.headers);
  headers.set("x-forwarded-proto", baseUrl.protocol.replace(":", ""));
  headers.set("x-forwarded-host", baseUrl.host);
  headers.set("host", baseUrl.host);
  headers.delete("content-length");
  headers.delete("content-type");

  const csrfResponse = await authHandlers.GET({
    request: new Request(csrfUrl.toString(), {
      method: "GET",
      headers,
    }),
    response: new Response(),
  });

  let csrfToken = "";
  try {
    const data = (await csrfResponse.json()) as { csrfToken?: string };
    csrfToken = data.csrfToken?.trim() ?? "";
  } catch {
    csrfToken = "";
  }

  return { base, csrfToken, csrfResponse };
}
