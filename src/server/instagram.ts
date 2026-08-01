import { createServerFn } from "@tanstack/react-start";

import { instagramReels } from "@/lib/site-data";

const VIEW_COUNT_PATTERN = /video_view_count":(\d+)/;
const CACHE_TTL_MS = 60 * 60 * 1000;

let viewCache: { fetchedAt: number; views: Record<string, number> } | null = null;

async function fetchReelViewCountFromEmbed(permalink: string): Promise<number | null> {
  const embedUrl = `${permalink.replace(/\/$/, "")}/embed`;

  try {
    const response = await fetch(embedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; VKStudio/1.0; +https://vkstudio.com)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const match = html.match(VIEW_COUNT_PATTERN);
    if (!match) return null;

    const views = Number.parseInt(match[1], 10);
    return Number.isFinite(views) ? views : null;
  } catch {
    return null;
  }
}

async function resolveInstagramReelViews(): Promise<Record<string, number>> {
  if (viewCache && Date.now() - viewCache.fetchedAt < CACHE_TTL_MS) {
    return viewCache.views;
  }

  const views: Record<string, number> = {};

  await Promise.all(
    instagramReels.map(async (reel) => {
      if (typeof reel.views === "number") {
        views[reel.id] = reel.views;
        return;
      }

      const count = await fetchReelViewCountFromEmbed(reel.permalink);
      if (count !== null) {
        views[reel.id] = count;
      }
    }),
  );

  viewCache = { fetchedAt: Date.now(), views };
  return views;
}

export const fetchInstagramReelViews = createServerFn({ method: "GET" }).handler(
  async () => resolveInstagramReelViews(),
);
