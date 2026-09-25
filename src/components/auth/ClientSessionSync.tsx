import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth";
import { logClientAudit } from "@/lib/client-audit";
import { isLoggedOutFlagSet } from "@/lib/logout-state";

const OAUTH_PENDING_KEY = "vk_oauth_pending";

/** Keeps local client session in sync after Google OAuth (cookie-based). */
export function ClientSessionSync() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { refreshClientSession, clientUser } = useAuth();
  const loggedOAuth = useRef(false);
  const syncedOnce = useRef(false);

  useEffect(() => {
    if (syncedOnce.current) return;
    if (isLoggedOutFlagSet()) return;
    if (pathname === "/login" || pathname === "/signup") return;
    syncedOnce.current = true;
    void refreshClientSession();
  }, [pathname, refreshClientSession]);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (!clientUser || loggedOAuth.current) return;

    const pending = sessionStorage.getItem(OAUTH_PENDING_KEY);
    if (!pending) return;

    loggedOAuth.current = true;
    sessionStorage.removeItem(OAUTH_PENDING_KEY);

    logClientAudit("auth.oauth.session.established", {
      status: "success",
      email: clientUser.email,
      userId: clientUser.id,
      message: "OAuth session active in browser",
      metadata: {
        provider: "google",
        name: clientUser.name,
        path: pathname,
      },
    });
  }, [clientUser, pathname]);

  return null;
}

export function markOAuthPending() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(OAUTH_PENDING_KEY, "1");
}
