import { DEFAULT_INSTAGRAM_SETTINGS } from "@/lib/instagram-settings";

export function getStaticReelViews(): Record<string, number> {
  const views: Record<string, number> = {};
  for (const reel of DEFAULT_INSTAGRAM_SETTINGS.reels) {
    if (typeof reel.views === "number") {
      views[reel.id] = reel.views;
    }
  }
  return views;
}
