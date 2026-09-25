import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { query } from "@/server/db";

const STATIC_PATHS = [
  "/",
  "/shop",
  "/customize",
  "/philosophy",
  "/contact",
  "/overview",
  "/lifestyle",
  "/location",
];

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let productIds: string[] = [];
        try {
          const rows = await query<{ id: string }>(
            "SELECT id FROM products ORDER BY updated_at DESC",
          );
          productIds = rows.map((row) => row.id);
        } catch {
          productIds = [];
        }

        const lastmod = new Date().toISOString();
        const urls = [
          ...STATIC_PATHS.map((path) => ({
            loc: absoluteUrl(path),
            changefreq: path === "/" || path === "/shop" ? "daily" : "weekly",
            priority: path === "/" ? "1.0" : path === "/shop" ? "0.9" : "0.7",
          })),
          ...productIds.map((id) => ({
            loc: absoluteUrl(`/shop/${id}`),
            changefreq: "weekly",
            priority: "0.8",
          })),
        ];

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) => `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            "X-Robots-Tag": `Sitemap: ${getSiteUrl()}/sitemap.xml`,
          },
        });
      },
    },
  },
});
