import { ExternalLink, Eye } from "lucide-react";
import { useEffect, useState } from "react";

import { formatInstagramViews } from "@/lib/instagram-views";
import {
  DEFAULT_INSTAGRAM_SETTINGS,
  formatInstagramSubtitle,
  type InstagramSettings,
} from "@/lib/instagram-settings";
import type { InstagramReel } from "@/lib/site-data";
import { isStaticSite } from "@/lib/static-site";
import { getInstagramSettings } from "@/server/instagram-settings";

function loadInstagramEmbedScript() {
  if (document.querySelector('script[src*="instagram.com/embed.js"]')) return;
  const script = document.createElement("script");
  script.src = "https://www.instagram.com/embed.js";
  script.async = true;
  document.body.appendChild(script);
}

function reelEmbedSrc(permalink: string) {
  const trimmed = permalink.replace(/\/$/, "");
  return `${trimmed}/embed`;
}

function ReelCard({
  reel,
  views,
}: {
  reel: InstagramReel;
  views?: number;
}) {
  return (
    <div className="relative w-[200px] shrink-0 overflow-hidden rounded-2xl border border-border bg-white shadow-sm sm:w-[220px]">
      <iframe
        title={reel.title}
        src={reelEmbedSrc(reel.permalink)}
        className="h-[min(70vh,480px)] w-full border-0"
        loading="lazy"
        allow="encrypted-media"
      />
      {views !== undefined ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Eye className="size-3.5 shrink-0" aria-hidden />
          <span>{formatInstagramViews(views)} views</span>
        </div>
      ) : null}
    </div>
  );
}

function ReelMarquee({
  reels,
  viewsById,
}: {
  reels: readonly InstagramReel[];
  viewsById: Record<string, number>;
}) {
  const copies = ["a", "b"] as const;

  return (
    <div className="reel-marquee relative overflow-hidden py-2">
      <div className="reel-marquee-track flex w-max gap-4">
        {copies.map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 gap-4 pr-4"
            aria-hidden={copy === "b" ? true : undefined}
          >
            {reels.map((reel) => (
              <ReelCard
                key={`${reel.id}-${copy}`}
                reel={reel}
                views={viewsById[reel.id]}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function InstagramReelStrip({
  reelViews = {},
}: {
  reelViews?: Record<string, number>;
}) {
  const [settings, setSettings] = useState<InstagramSettings>(DEFAULT_INSTAGRAM_SETTINGS);

  useEffect(() => {
    loadInstagramEmbedScript();
  }, []);

  useEffect(() => {
    if (isStaticSite) {
      setSettings(DEFAULT_INSTAGRAM_SETTINGS);
      return;
    }
    let cancelled = false;
    void getInstagramSettings()
      .then((next) => {
        if (!cancelled) setSettings(next);
      })
      .catch(() => {
        if (!cancelled) setSettings(DEFAULT_INSTAGRAM_SETTINGS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subtitle = formatInstagramSubtitle(settings);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-burgundy/70">
              {settings.sectionEyebrow}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-burgundy md:text-4xl">
              {settings.sectionTitle}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={settings.reelsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-burgundy/30 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-burgundy hover:bg-blush-section"
            >
              View reels
              <ExternalLink className="size-4" />
            </a>
            <a
              href={settings.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-burgundy px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
            >
              Follow @{settings.handle}
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-blush-section shadow-sm lg:sticky lg:top-24">
            <iframe
              title={`Instagram profile @${settings.handle}`}
              src={settings.embedProfileUrl}
              className="h-[480px] w-full border-0"
              loading="lazy"
            />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Reels
            </p>

            {settings.reels.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No reels configured yet. Add reel links in Admin → Instagram.
              </p>
            ) : (
              <div className="relative mt-4 overflow-hidden">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent sm:w-10"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent sm:w-10"
                  aria-hidden
                />
                <ReelMarquee reels={settings.reels} viewsById={reelViews} />
              </div>
            )}

            <a
              href={settings.reelsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-burgundy hover:underline"
            >
              View all reels on Instagram
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
