import { createServerFn } from "@tanstack/react-start";

const VIEW_COUNT_PATTERN = /video_view_count":(\d+)/;
const THUMBNAIL_PATTERNS = [
  /"display_url":"(https:\\\/\\\/[^"]+)"/,
  /"thumbnail_src":"(https:\\\/\\\/[^"]+)"/,
  /property="og:image" content="(https:\/\/[^"]+)"/,
];
const CACHE_TTL_MS = 60 * 60 * 1000;

export type InstagramReelMedia = {
  views: Record<string, number>;
  thumbnails: Record<string, string>;
};

let mediaCache: { fetchedAt: number; media: InstagramReelMedia } | null = null;

export function clearInstagramMediaCache() {
  mediaCache = null;
}

function decodeInstagramUrl(raw: string) {
  return raw
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"');
}

async function fetchReelEmbedHtml(permalink: string): Promise<string | null> {
  const embedUrl = `${permalink.replace(/\/$/, "")}/embed`;
  try {
    const response = await fetch(embedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function fetchOEmbedThumbnail(permalink: string): Promise<string | null> {
  try {
    const url = `https://api.instagram.com/oembed/?url=${encodeURIComponent(permalink)}&omitscript=true`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3_000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { thumbnail_url?: string };
    return typeof data.thumbnail_url === "string" ? data.thumbnail_url : null;
  } catch {
    return null;
  }
}

function extractThumbnail(html: string): string | null {
  for (const pattern of THUMBNAIL_PATTERNS) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeInstagramUrl(match[1]);
  }
  return null;
}

function extractViews(html: string): number | null {
  const match = html.match(VIEW_COUNT_PATTERN);
  if (!match) return null;
  const views = Number.parseInt(match[1], 10);
  return Number.isFinite(views) ? views : null;
}

async function resolveInstagramReelMedia(): Promise<InstagramReelMedia> {
  if (mediaCache && Date.now() - mediaCache.fetchedAt < CACHE_TTL_MS) {
    return mediaCache.media;
  }

  const { readInstagramSettings } = await import("@/server/instagram-settings.server");
  const settings = await readInstagramSettings();
  const views: Record<string, number> = {};
  const thumbnails: Record<string, string> = {};

  await Promise.all(
    settings.reels.map(async (reel) => {
      if (typeof reel.views === "number") {
        views[reel.id] = reel.views;
      }

      const [html, oembedThumb] = await Promise.all([
        fetchReelEmbedHtml(reel.permalink),
        fetchOEmbedThumbnail(reel.permalink),
      ]);

      if (oembedThumb) {
        thumbnails[reel.id] = oembedThumb;
      } else if (html) {
        const thumb = extractThumbnail(html);
        if (thumb) thumbnails[reel.id] = thumb;
      }

      if (html && views[reel.id] === undefined) {
        const count = extractViews(html);
        if (count !== null) views[reel.id] = count;
      }
    }),
  );

  const media = { views, thumbnails };
  mediaCache = { fetchedAt: Date.now(), media };
  return media;
}

export const fetchInstagramReelViews = createServerFn({ method: "GET" }).handler(
  async () => {
    const media = await resolveInstagramReelMedia();
    return media.views;
  },
);

export const fetchInstagramReelMedia = createServerFn({ method: "GET" }).handler(
  async () => resolveInstagramReelMedia(),
);
