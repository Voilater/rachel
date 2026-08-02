import { instagramReels } from "@/lib/site-data";

export function getStaticReelViews(): Record<string, number> {
  const views: Record<string, number> = {};
  for (const reel of instagramReels) {
    if (typeof reel.views === "number") {
      views[reel.id] = reel.views;
    }
  }
  return views;
}
