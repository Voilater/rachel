import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth";
import { isLoggedOutFlagSet } from "@/lib/logout-state";

/** Keeps local client session in sync after Google OAuth (cookie-based). */
export function ClientSessionSync() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { refreshClientSession } = useAuth();

  useEffect(() => {
    if (isLoggedOutFlagSet()) return;
    // Avoid racing the login/signup form while credentials are being saved
    if (pathname === "/login" || pathname === "/signup") return;
    refreshClientSession();
  }, [pathname, refreshClientSession]);

  return null;
}
