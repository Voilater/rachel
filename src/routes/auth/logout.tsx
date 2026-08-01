import { createFileRoute } from "@tanstack/react-router";
import { StartAuthJS } from "start-authjs";

import { authConfig } from "@/lib/auth0-config";
import { clearCredentialCookie } from "@/server/credential-session";

const authHandlers = StartAuthJS(authConfig);

function forwardSetCookies(from: Response, to: Headers) {
  if (typeof from.headers.getSetCookie === "function") {
    for (const cookie of from.headers.getSetCookie()) {
      to.append("Set-Cookie", cookie);
    }
    return;
  }
  const raw = from.headers.get("set-cookie");
  if (raw) to.append("Set-Cookie", raw);
}

function escapeHtmlAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function auth0LogoutUrl(origin: string, returnTo: string) {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID ?? process.env.AUTH_AUTH0_ID;
  if (!domain || !clientId) return null;
  const host = domain.startsWith("https://") ? domain : `https://${domain}`;
  const url = new URL("/v2/logout", host);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("returnTo", returnTo);
  return url.toString();
}

export const Route = createFileRoute("/auth/logout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        clearCredentialCookie();

        const url = new URL(request.url);
        let callbackUrl = url.searchParams.get("callbackUrl") ?? `${url.origin}/login`;
        if (callbackUrl.startsWith("/")) {
          callbackUrl = `${url.origin}${callbackUrl}`;
        }

        const csrfUrl = new URL("/api/auth/csrf", url.origin);
        const csrfRes = await authHandlers.GET({
          request: new Request(csrfUrl.toString(), {
            method: "GET",
            headers: request.headers,
          }),
          response: new Response(),
        });

        let csrfToken = "";
        try {
          const data = (await csrfRes.json()) as { csrfToken?: string };
          csrfToken = data.csrfToken ?? "";
        } catch {
          return new Response("Could not sign out. Please try again.", { status: 500 });
        }

        if (!csrfToken) {
          return new Response("Could not sign out. Please try again.", { status: 500 });
        }

        const federatedLogout = auth0LogoutUrl(url.origin, callbackUrl);
        const safeCallback = escapeHtmlAttr(callbackUrl);
        const federatedInput = federatedLogout
          ? `<input type="hidden" name="callbackUrl" value="${escapeHtmlAttr(federatedLogout)}" />`
          : `<input type="hidden" name="callbackUrl" value="${safeCallback}" />`;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Signing out…</title>
</head>
<body>
  <p style="font-family: system-ui, sans-serif; text-align: center; margin-top: 40vh; color: #666;">
    Signing out…
  </p>
  <form id="signout" method="POST" action="/api/auth/signout">
    <input type="hidden" name="csrfToken" value="${escapeHtmlAttr(csrfToken)}" />
    ${federatedInput}
  </form>
  <script>
    try {
      sessionStorage.setItem("vk_logged_out", "1");
      localStorage.removeItem("vk_client_session");
      localStorage.removeItem("vk_cart");
      localStorage.removeItem("vk_guest_id");
    } catch (e) {}
    document.getElementById("signout").submit();
  </script>
</body>
</html>`;

        const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
        forwardSetCookies(csrfRes, headers);

        return new Response(html, { status: 200, headers });
      },
    },
  },
  component: LogoutFallback,
});

function LogoutFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Signing out…
    </div>
  );
}
