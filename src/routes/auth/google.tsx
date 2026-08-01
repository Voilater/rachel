import { createFileRoute } from "@tanstack/react-router";
import { StartAuthJS } from "start-authjs";

import { authConfig } from "@/lib/auth0-config";
import { GOOGLE_OAUTH_CONNECTION } from "@/lib/google-oauth";
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

export const Route = createFileRoute("/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        clearCredentialCookie();

        const url = new URL(request.url);
        const callbackUrl = url.searchParams.get("callbackUrl") ?? "/account";
        const screenHint = url.searchParams.get("screen_hint");

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
          return new Response("Could not start Google sign-in. Please try again.", {
            status: 500,
          });
        }

        if (!csrfToken) {
          return new Response("Could not start Google sign-in. Please try again.", {
            status: 500,
          });
        }

        const safeCallback = escapeHtmlAttr(callbackUrl);
        const screenHintInput =
          screenHint === "signup"
            ? `<input type="hidden" name="screen_hint" value="signup" />`
            : "";

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting to Google…</title>
</head>
<body>
  <p style="font-family: system-ui, sans-serif; text-align: center; margin-top: 40vh; color: #666;">
    Redirecting to Google…
  </p>
  <form id="oauth" method="POST" action="/api/auth/signin/auth0">
    <input type="hidden" name="csrfToken" value="${escapeHtmlAttr(csrfToken)}" />
    <input type="hidden" name="callbackUrl" value="${safeCallback}" />
    <input type="hidden" name="connection" value="${GOOGLE_OAUTH_CONNECTION}" />
    ${screenHintInput}
  </form>
  <script>document.getElementById("oauth").submit();</script>
</body>
</html>`;

        const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
        forwardSetCookies(csrfRes, headers);

        return new Response(html, { status: 200, headers });
      },
    },
  },
  component: GoogleOAuthFallback,
});

function GoogleOAuthFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Redirecting to Google…
    </div>
  );
}
