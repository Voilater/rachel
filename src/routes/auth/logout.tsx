import { createFileRoute } from "@tanstack/react-router";

import { clearCredentialCookie } from "@/server/credential-session";

function escapeHtmlAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const Route = createFileRoute("/auth/logout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        clearCredentialCookie();

        const { appAuthBaseUrl, fetchAuthCsrfToken, forwardSetCookies } = await import(
          "@/server/auth-csrf"
        );
        const base = appAuthBaseUrl(request);
        const url = new URL(request.url);
        let callbackUrl = url.searchParams.get("callbackUrl") ?? `${base}/login`;
        if (callbackUrl.startsWith("/")) {
          callbackUrl = `${base}${callbackUrl}`;
        }

        try {
          const { writeAuditLog } = await import("@/server/audit-log.server");
          await writeAuditLog({
            action: "auth.logout",
            status: "success",
            request,
            message: "User signed out",
            metadata: { callbackUrl },
          });
        } catch {
          // ignore audit failures
        }

        const { csrfToken, csrfResponse } = await fetchAuthCsrfToken(request);
        if (!csrfToken) {
          return new Response("Could not sign out. Please try again.", { status: 500 });
        }

        const safeCallback = escapeHtmlAttr(callbackUrl);
        const action = escapeHtmlAttr(`${base}/api/auth/signout`);

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
  <form id="signout" method="POST" action="${action}">
    <input type="hidden" name="csrfToken" value="${escapeHtmlAttr(csrfToken)}" />
    <input type="hidden" name="callbackUrl" value="${safeCallback}" />
  </form>
  <script>
    try {
      const migrate = (storage, oldKey, newKey) => {
        const oldValue = storage.getItem(oldKey);
        if (oldValue !== null) {
          if (storage.getItem(newKey) === null) storage.setItem(newKey, oldValue);
          storage.removeItem(oldKey);
        }
      };
      migrate(sessionStorage, "vk_logged_out", "rachelparadise_logged_out");
      migrate(sessionStorage, "vk_logging_out", "rachelparadise_logging_out");
      sessionStorage.setItem("rachelparadise_logged_out", "1");
      migrate(localStorage, "vk_client_session", "rachelparadise_client_session");
      migrate(localStorage, "vk_cart", "rachelparadise_cart");
      migrate(localStorage, "vk_guest_id", "rachelparadise_guest_id");
      localStorage.removeItem("rachelparadise_client_session");
      localStorage.removeItem("rachelparadise_cart");
      localStorage.removeItem("rachelparadise_guest_id");
    } catch (e) {}
    document.getElementById("signout").submit();
  </script>
</body>
</html>`;

        const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
        forwardSetCookies(csrfResponse, headers);

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
