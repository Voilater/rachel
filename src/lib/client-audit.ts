import { collectBrowserMeta } from "@/lib/browser-meta";
import { isStaticSite } from "@/lib/static-site";
import { recordAuditEvent } from "@/server/audit";

/** Fire-and-forget client audit event with browser fingerprint metadata. */
export function logClientAudit(
  action: string,
  options?: {
    status?: "success" | "failure" | "info";
    email?: string;
    userId?: string;
    message?: string;
    metadata?: Record<string, unknown>;
  },
) {
  if (isStaticSite || typeof window === "undefined") return;

  void recordAuditEvent({
    data: {
      action,
      status: options?.status ?? "info",
      email: options?.email,
      userId: options?.userId,
      path: `${window.location.pathname}${window.location.search}`,
      message: options?.message,
      metadata: options?.metadata,
      browser: collectBrowserMeta(),
    },
  }).catch(() => {});
}
