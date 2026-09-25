import { createServerFn } from "@tanstack/react-start";

import type { BrowserMeta } from "@/lib/browser-meta";

type AuditStatus = "success" | "failure" | "info";

/**
 * Client-safe RPC wrappers. Handlers dynamically import `*.server.ts`
 * so Vite import-protection does not block the client bundle.
 */
export const recordAuditEvent = createServerFn({ method: "POST" })
  .validator(
    (data: {
      action: string;
      status?: AuditStatus;
      email?: string;
      userId?: string;
      path?: string;
      message?: string;
      metadata?: Record<string, unknown>;
      browser?: BrowserMeta;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { writeAuditLog } = await import("@/server/audit-log.server");

    let userId = data.userId ?? null;
    let email = data.email ?? null;
    try {
      const { resolveSessionUser } = await import("@/server/session-resolve");
      const sessionUser = await resolveSessionUser();
      if (sessionUser) {
        userId = userId ?? sessionUser.id;
        email = email ?? sessionUser.email;
      }
    } catch {
      // session optional
    }

    await writeAuditLog({
      action: data.action,
      status: data.status ?? "info",
      userId,
      email,
      path: data.path,
      message: data.message,
      metadata: data.metadata,
      browser: data.browser,
    });

    return { ok: true as const };
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .validator((data?: { limit?: number; action?: string }) => data ?? {})
  .handler(async ({ data }) => {
    const { listAuditLogRows } = await import("@/server/audit-log.server");
    return listAuditLogRows({
      limit: data.limit,
      action: data.action,
    });
  });
