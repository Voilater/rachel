import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";

import { siteConfig } from "@/lib/site-data";
import { listAuditLogs } from "@/server/audit";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [{ title: `Audit Logs — ${siteConfig.name} Admin` }],
  }),
  component: AdminAuditPage,
});

type AuditRow = Awaited<ReturnType<typeof listAuditLogs>>[number];

function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listAuditLogs({
        data: {
          limit: 200,
          action: actionFilter.trim() || undefined,
        },
      });
      setLogs(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-burgundy md:text-3xl">Audit Logs</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            IP, user agent, and browser metadata for auth, cart, orders, and page views
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="Filter by action (e.g. auth.login.success)"
          className="min-w-[260px] flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
        />
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-burgundy"
        >
          Apply
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading logs…</p>
      ) : logs.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No audit events yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-blush-card/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const open = expandedId === log.id;
                return (
                  <Fragment key={log.id}>
                    <tr
                      className="cursor-pointer border-b border-border/70 hover:bg-blush-section/40"
                      onClick={() => setExpandedId(open ? null : log.id)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-burgundy">{log.action}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={log.status} />
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3">{log.email ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        {log.ipAddress ?? "—"}
                      </td>
                      <td className="max-w-[280px] truncate px-4 py-3 text-xs text-muted-foreground">
                        {log.userAgent ?? "—"}
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-border bg-muted/30">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <DetailBlock title="Message" value={log.message ?? "—"} />
                            <DetailBlock title="Path" value={`${log.method ?? ""} ${log.path ?? "—"}`} />
                            <DetailBlock title="User ID" value={log.userId ?? "—"} />
                          </div>
                          <div className="mt-4 grid gap-4 lg:grid-cols-3">
                            <JsonBlock title="Request headers" data={log.requestHeaders} />
                            <JsonBlock title="Browser meta" data={log.browserMeta} />
                            <JsonBlock title="Metadata" data={log.metadata} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "success"
      ? "bg-green-100 text-green-800"
      : status === "failure"
        ? "bg-red-100 text-red-800"
        : "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${styles}`}>
      {status}
    </span>
  );
}

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-1 break-all text-sm">{value}</p>
    </div>
  );
}

function JsonBlock({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown> | null;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-white p-3 text-[11px] leading-relaxed text-foreground">
        {data ? JSON.stringify(data, null, 2) : "—"}
      </pre>
    </div>
  );
}
