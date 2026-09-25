import { getRequest } from "@tanstack/react-start/server";

import type { BrowserMeta } from "@/lib/browser-meta";
import { execute, query } from "@/server/db";

export type AuditStatus = "success" | "failure" | "info";

export interface AuditLogInput {
  action: string;
  status?: AuditStatus;
  userId?: string | null;
  email?: string | null;
  path?: string | null;
  method?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  browser?: BrowserMeta | null;
  request?: Request | null;
}

export interface AuditLogRow {
  id: number;
  action: string;
  status: AuditStatus;
  user_id: string | null;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  path: string | null;
  method: string | null;
  message: string | null;
  request_headers: string | null;
  browser_meta: string | null;
  metadata: string | null;
  created_at: Date | string;
}

const SENSITIVE_META_KEYS = new Set([
  "password",
  "password_hash",
  "passwd",
  "secret",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "authorization",
  "cookie",
  "card",
  "card_number",
  "cvv",
  "cvc",
  "pan",
]);

const CAPTURED_HEADERS = [
  "user-agent",
  "accept",
  "accept-language",
  "accept-encoding",
  "referer",
  "origin",
  "host",
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "x-forwarded-proto",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "sec-fetch-site",
  "sec-fetch-mode",
  "sec-fetch-dest",
  "sec-fetch-user",
  "dnt",
] as const;

function sanitizeObject(
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!value) return null;
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (SENSITIVE_META_KEYS.has(key.toLowerCase())) continue;
    if (raw === undefined) continue;
    out[key] = raw;
  }
  return Object.keys(out).length ? out : null;
}

export function extractClientIp(request: Request | null | undefined): string | null {
  if (!request) return null;
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  const cfIp = headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp.slice(0, 64);
  return null;
}

function collectRequestHeaders(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of CAPTURED_HEADERS) {
    const value = request.headers.get(name);
    if (value) out[name] = value.slice(0, 1024);
  }
  const cookie = request.headers.get("cookie");
  if (cookie) {
    const names = cookie
      .split(";")
      .map((part) => part.trim().split("=")[0])
      .filter(Boolean);
    out["cookie_names"] = names.join(", ").slice(0, 512);
    out["has_cookies"] = "true";
  }
  return out;
}

function resolveRequest(explicit?: Request | null): Request | null {
  if (explicit) return explicit;
  try {
    return getRequest();
  } catch {
    return null;
  }
}

/** Persist an audit event. Never throws to callers — logging must not break checkout/auth. */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const request = resolveRequest(input.request);
    const ip = extractClientIp(request);
    const userAgent =
      request?.headers.get("user-agent")?.slice(0, 1024) ??
      input.browser?.userAgent?.slice(0, 1024) ??
      null;

    let path = input.path ?? null;
    let method = input.method ?? null;
    if (request) {
      try {
        const url = new URL(request.url);
        path = path ?? `${url.pathname}${url.search}`.slice(0, 512);
        method = method ?? request.method;
      } catch {
        // ignore bad URL
      }
    }

    const requestHeaders = request ? collectRequestHeaders(request) : null;
    const browser = sanitizeObject(
      (input.browser ?? null) as Record<string, unknown> | null,
    );
    const metadata = sanitizeObject(input.metadata);

    await execute(
      `INSERT INTO audit_logs (
        action, status, user_id, email, ip_address, user_agent,
        path, method, message, request_headers, browser_meta, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.action.slice(0, 128),
        input.status ?? "info",
        input.userId?.slice(0, 64) ?? null,
        input.email?.toLowerCase().slice(0, 255) ?? null,
        ip,
        userAgent,
        path,
        method?.slice(0, 16) ?? null,
        input.message?.slice(0, 512) ?? null,
        requestHeaders ? JSON.stringify(requestHeaders) : null,
        browser ? JSON.stringify(browser) : null,
        metadata ? JSON.stringify(metadata) : null,
      ],
    );
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}

function safeJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed as unknown };
  } catch {
    return null;
  }
}

/** Server-only listing used by RPC wrapper in `audit.ts`. */
export async function listAuditLogRows(input?: { limit?: number; action?: string }) {
  const limit = Math.min(Math.max(Number(input?.limit ?? 100), 1), 500);
  const action = typeof input?.action === "string" ? input.action.trim() : "";

  const rows = action
    ? await query<AuditLogRow>(
        `SELECT * FROM audit_logs WHERE action = ? ORDER BY created_at DESC LIMIT ${limit}`,
        [action],
      )
    : await query<AuditLogRow>(
        `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ${limit}`,
      );

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    status: row.status,
    userId: row.user_id,
    email: row.email,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    path: row.path,
    method: row.method,
    message: row.message,
    requestHeaders: safeJson(row.request_headers),
    browserMeta: safeJson(row.browser_meta),
    metadata: safeJson(row.metadata),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }));
}
