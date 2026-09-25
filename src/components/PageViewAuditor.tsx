import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { isStaticSite } from "@/lib/static-site";

/** Lightweight page-view logging — deferred so it never blocks rendering. */
export function PageViewAuditor() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const lastKey = useRef("");

  useEffect(() => {
    if (isStaticSite) return;
    if (pathname.startsWith("/admin")) return;

    const key = `${pathname}${search}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    const run = () => {
      void import("@/lib/client-audit").then(({ logClientAudit }) => {
        logClientAudit("page.view", {
          status: "info",
          message: `Viewed ${pathname}`,
          metadata: { pathname, search },
        });
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(run, 1200);
    return () => window.clearTimeout(timer);
  }, [pathname, search]);

  return null;
}
