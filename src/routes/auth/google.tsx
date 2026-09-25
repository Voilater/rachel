import { createFileRoute } from "@tanstack/react-router";

import { serverRedirect } from "@/lib/server-redirect";
import { clearCredentialCookie } from "@/server/credential-session";

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
        const { isGoogleOAuthConfigured } = await import("@/lib/auth0-config");
        if (!isGoogleOAuthConfigured()) {
          return redirectMissingGoogle(request);
        }

        clearCredentialCookie();

        const url = new URL(request.url);
        const callbackUrl = url.searchParams.get("callbackUrl") ?? "/account";

        try {
          const { writeAuditLog } = await import("@/server/audit-log.server");
          await writeAuditLog({
            action: "auth.oauth.start",
            status: "info",
            request,
            message: "Google OAuth redirect started",
            metadata: {
              provider: "google",
              callbackUrl,
            },
          });
        } catch {
          // ignore
        }

        const { fetchAuthCsrfToken, forwardSetCookies } = await import(
          "@/server/auth-csrf"
        );
        const { base, csrfToken, csrfResponse } = await fetchAuthCsrfToken(request);
        if (!csrfToken) {
          return new Response("Could not start Google sign-in. Please try again.", {
            status: 500,
          });
        }

        const safeCallback = escapeHtmlAttr(callbackUrl);
        const action = escapeHtmlAttr(`${base}/api/auth/signin/google`);

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
  <form id="oauth" method="POST" action="${action}">
    <input type="hidden" name="csrfToken" value="${escapeHtmlAttr(csrfToken)}" />
    <input type="hidden" name="callbackUrl" value="${safeCallback}" />
  </form>
  <script>document.getElementById("oauth").submit();</script>
</body>
</html>`;

        const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
        forwardSetCookies(csrfResponse, headers);

        return new Response(html, { status: 200, headers });
      },
    },
  },
  component: GoogleOAuthFallback,
});

function redirectMissingGoogle(request: Request) {
  const url = new URL(request.url);
  const params = new URLSearchParams({
    error:
      "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.",
  });
  return serverRedirect(`${url.origin}/login?${params.toString()}`);
}

function GoogleOAuthFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Redirecting to Google…
    </div>
  );
}
