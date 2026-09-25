import { createFileRoute } from "@tanstack/react-router";
import { StartAuthJS } from "start-authjs";

import { authConfig } from "@/lib/auth0-config";
import { writeAuditLog } from "@/server/audit-log.server";

const { GET, POST } = StartAuthJS(authConfig);

function canonicalAuthRequest(request: Request): Request {
  const base =
    process.env.APP_BASE_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/api\/auth\/?$/, "") ||
    "";
  if (!base.startsWith("http")) return request;

  const incoming = new URL(request.url);
  const canonical = new URL(`${incoming.pathname}${incoming.search}`, base);
  if (canonical.href === incoming.href) return request;

  // Preserve method/headers/body while forcing https canonical origin for Auth.js.
  return new Request(canonical.href, request);
}

function oauthStepFromPath(pathname: string) {
  if (pathname.includes("/callback")) return "callback";
  if (pathname.includes("/signin")) return "signin";
  if (pathname.includes("/signout")) return "signout";
  if (pathname.includes("/session")) return "session";
  if (pathname.includes("/csrf")) return "csrf";
  return "other";
}

async function logOAuthHttp(request: Request, method: "GET" | "POST") {
  try {
    const url = new URL(request.url);
    const step = oauthStepFromPath(url.pathname);
    // Skip noisy csrf/session polls; keep auth-critical OAuth traffic.
    if (step === "csrf" || step === "session" || step === "other") return;

    await writeAuditLog({
      action: `auth.oauth.http.${step}`,
      status: "info",
      request,
      method,
      path: `${url.pathname}${url.search}`,
      message: `OAuth ${method} ${step}`,
      metadata: {
        provider: "google",
        step,
        error: url.searchParams.get("error"),
        errorDescription: url.searchParams.get("error_description"),
      },
    });
  } catch {
    // ignore
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authRequest = canonicalAuthRequest(request);
        await logOAuthHttp(authRequest, "GET");
        return GET({ request: authRequest, response: new Response() });
      },
      POST: async ({ request }) => {
        const authRequest = canonicalAuthRequest(request);
        await logOAuthHttp(authRequest, "POST");
        return POST({ request: authRequest, response: new Response() });
      },
    },
  },
});
