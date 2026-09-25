import type { InstagramReel } from "@/lib/site-data";
import { instagramReels, siteConfig } from "@/lib/site-data";

export type InstagramSettings = {
  handle: string;
  sectionEyebrow: string;
  sectionTitle: string;
  sectionSubtitle: string;
  profileUrl: string;
  reelsUrl: string;
  embedProfileUrl: string;
  reels: InstagramReel[];
};

export function normalizeInstagramHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").replace(/\/+$/, "");
}

export function urlsFromHandle(handle: string) {
  const h = normalizeInstagramHandle(handle) || "instagram";
  return {
    profileUrl: `https://www.instagram.com/${h}/`,
    reelsUrl: `https://www.instagram.com/${h}/reels/`,
    embedProfileUrl: `https://www.instagram.com/${h}/embed`,
  };
}

export function reelIdFromPermalink(permalink: string): string {
  const match = permalink.match(/\/(?:reel|reels|p)\/([^/?#]+)/i);
  if (match?.[1]) return `reel-${match[1]}`;
  const slug = permalink
    .replace(/^https?:\/\//i, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `reel-${slug || Date.now()}`;
}

export function normalizeReel(input: {
  id?: string;
  title?: string;
  permalink: string;
  views?: number | null;
}): InstagramReel | null {
  const permalink = input.permalink.trim();
  if (!permalink) return null;
  const id = (input.id?.trim() || reelIdFromPermalink(permalink)).slice(0, 128);
  const title = (input.title?.trim() || "Instagram reel").slice(0, 120);
  const views =
    typeof input.views === "number" && Number.isFinite(input.views) && input.views >= 0
      ? Math.floor(input.views)
      : undefined;
  return views !== undefined ? { id, title, permalink, views } : { id, title, permalink };
}

export const DEFAULT_INSTAGRAM_SETTINGS: InstagramSettings = {
  handle: siteConfig.instagram.handle,
  sectionEyebrow: "Follow the studio",
  sectionTitle: "Rachel Paradise on Instagram",
  sectionSubtitle:
    "Scroll through reels and behind-the-scenes from @{handle}. Hover reels to pause.",
  profileUrl: siteConfig.instagram.profileUrl,
  reelsUrl: siteConfig.instagram.reelsUrl,
  embedProfileUrl: siteConfig.instagram.embedProfileUrl,
  reels: [...instagramReels],
};

export function formatInstagramSubtitle(settings: InstagramSettings): string {
  const handle = normalizeInstagramHandle(settings.handle);
  return settings.sectionSubtitle.replaceAll("{handle}", handle).replaceAll("@{handle}", `@${handle}`);
}

export function sanitizeInstagramSettings(input: Partial<InstagramSettings>): InstagramSettings {
  const handle = normalizeInstagramHandle(input.handle ?? DEFAULT_INSTAGRAM_SETTINGS.handle);
  const derived = urlsFromHandle(handle);
  const reels = (input.reels ?? DEFAULT_INSTAGRAM_SETTINGS.reels)
    .map((reel) => normalizeReel(reel))
    .filter((reel): reel is InstagramReel => Boolean(reel));

  return {
    handle,
    sectionEyebrow: (input.sectionEyebrow ?? DEFAULT_INSTAGRAM_SETTINGS.sectionEyebrow).trim() ||
      DEFAULT_INSTAGRAM_SETTINGS.sectionEyebrow,
    sectionTitle: (input.sectionTitle ?? DEFAULT_INSTAGRAM_SETTINGS.sectionTitle).trim() ||
      DEFAULT_INSTAGRAM_SETTINGS.sectionTitle,
    sectionSubtitle:
      (input.sectionSubtitle ?? DEFAULT_INSTAGRAM_SETTINGS.sectionSubtitle).trim() ||
      DEFAULT_INSTAGRAM_SETTINGS.sectionSubtitle,
    profileUrl: (input.profileUrl ?? "").trim() || derived.profileUrl,
    reelsUrl: (input.reelsUrl ?? "").trim() || derived.reelsUrl,
    embedProfileUrl: (input.embedProfileUrl ?? "").trim() || derived.embedProfileUrl,
    reels,
  };
}
