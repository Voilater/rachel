import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DEFAULT_INSTAGRAM_SETTINGS,
  normalizeInstagramHandle,
  reelIdFromPermalink,
  urlsFromHandle,
  type InstagramSettings,
} from "@/lib/instagram-settings";
import { siteConfig } from "@/lib/site-data";
import {
  getInstagramSettings,
  saveInstagramSettings,
} from "@/server/instagram-settings";

export const Route = createFileRoute("/admin/instagram")({
  head: () => ({
    meta: [{ title: `Instagram — ${siteConfig.name} Admin` }],
  }),
  component: AdminInstagramPage,
});

type ReelDraft = {
  key: string;
  title: string;
  permalink: string;
  views: string;
};

function toDraft(settings: InstagramSettings): {
  form: Omit<InstagramSettings, "reels">;
  reels: ReelDraft[];
} {
  return {
    form: {
      handle: settings.handle,
      sectionEyebrow: settings.sectionEyebrow,
      sectionTitle: settings.sectionTitle,
      sectionSubtitle: settings.sectionSubtitle,
      profileUrl: settings.profileUrl,
      reelsUrl: settings.reelsUrl,
      embedProfileUrl: settings.embedProfileUrl,
    },
    reels: settings.reels.map((reel, index) => ({
      key: `${reel.id}-${index}`,
      title: reel.title,
      permalink: reel.permalink,
      views: typeof reel.views === "number" ? String(reel.views) : "",
    })),
  };
}

function AdminInstagramPage() {
  const [form, setForm] = useState<Omit<InstagramSettings, "reels">>(
    toDraft(DEFAULT_INSTAGRAM_SETTINGS).form,
  );
  const [reels, setReels] = useState<ReelDraft[]>(toDraft(DEFAULT_INSTAGRAM_SETTINGS).reels);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getInstagramSettings()
      .then((settings) => {
        if (cancelled) return;
        const draft = toDraft(settings);
        setForm(draft.form);
        setReels(draft.reels);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load Instagram settings.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateForm = <K extends keyof Omit<InstagramSettings, "reels">>(
    key: K,
    value: Omit<InstagramSettings, "reels">[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const syncUrlsFromHandle = () => {
    const urls = urlsFromHandle(form.handle);
    setForm((prev) => ({ ...prev, ...urls }));
  };

  const moveReel = (index: number, direction: -1 | 1) => {
    setReels((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const onSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const handle = normalizeInstagramHandle(form.handle);
      if (!handle) throw new Error("Instagram handle is required.");

      const payload: InstagramSettings = {
        ...form,
        handle,
        reels: reels
          .map((reel) => {
            const permalink = reel.permalink.trim();
            if (!permalink) return null;
            const viewsRaw = reel.views.trim();
            const views = viewsRaw ? Number(viewsRaw) : undefined;
            return {
              id: reelIdFromPermalink(permalink),
              title: reel.title.trim() || "Instagram reel",
              permalink,
              views: Number.isFinite(views) ? views : undefined,
            };
          })
          .filter((reel): reel is NonNullable<typeof reel> => Boolean(reel)),
      };

      const saved = await saveInstagramSettings({ data: payload });
      const draft = toDraft(saved);
      setForm(draft.form);
      setReels(draft.reels);
      setMessage("Instagram section saved. Home page will use these settings.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Instagram settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-sm text-muted-foreground">
        Loading Instagram settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-burgundy">Instagram</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Edit the home-page Instagram strip: profile, copy, and reel links.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-burgundy">Profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Handle</span>
            <input
              value={form.handle}
              onChange={(e) => updateForm("handle", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2"
              placeholder="rachel_paradise_"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={syncUrlsFromHandle}
              className="rounded-lg border border-burgundy/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-burgundy hover:bg-blush-section"
            >
              Sync URLs from handle
            </button>
          </div>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1.5 block font-medium text-foreground">Profile URL</span>
            <input
              value={form.profileUrl}
              onChange={(e) => updateForm("profileUrl", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Reels URL</span>
            <input
              value={form.reelsUrl}
              onChange={(e) => updateForm("reelsUrl", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Embed profile URL</span>
            <input
              value={form.embedProfileUrl}
              onChange={(e) => updateForm("embedProfileUrl", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-burgundy">Section copy</h2>
        <div className="mt-4 grid gap-4">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Eyebrow</span>
            <input
              value={form.sectionEyebrow}
              onChange={(e) => updateForm("sectionEyebrow", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Title</span>
            <input
              value={form.sectionTitle}
              onChange={(e) => updateForm("sectionTitle", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Subtitle</span>
            <textarea
              value={form.sectionSubtitle}
              onChange={(e) => updateForm("sectionSubtitle", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Use {"{handle}"} to insert the Instagram username.
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-burgundy">Reels</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Paste Instagram reel share links. Optional views override auto-fetch.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setReels((prev) => [
                ...prev,
                {
                  key: `new-${Date.now()}`,
                  title: "",
                  permalink: "",
                  views: "",
                },
              ])
            }
            className="inline-flex items-center gap-2 rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
          >
            <Plus className="size-4" />
            Add reel
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {reels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reels yet. Add at least one reel link.</p>
          ) : (
            reels.map((reel, index) => (
              <div
                key={reel.key}
                className="grid gap-3 rounded-xl border border-border bg-blush-section/40 p-4 md:grid-cols-[1fr_1fr_120px_auto]"
              >
                <label className="block text-sm md:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    Reel URL
                  </span>
                  <input
                    value={reel.permalink}
                    onChange={(e) =>
                      setReels((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, permalink: e.target.value } : row,
                        ),
                      )
                    }
                    placeholder="https://www.instagram.com/reel/..."
                    className="w-full rounded-lg border border-border bg-white px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    Title
                  </span>
                  <input
                    value={reel.title}
                    onChange={(e) =>
                      setReels((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, title: e.target.value } : row,
                        ),
                      )
                    }
                    className="w-full rounded-lg border border-border bg-white px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    Views (optional)
                  </span>
                  <input
                    value={reel.views}
                    onChange={(e) =>
                      setReels((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, views: e.target.value } : row,
                        ),
                      )
                    }
                    inputMode="numeric"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2"
                  />
                </label>
                <div className="flex items-end gap-2 md:col-span-4">
                  <button
                    type="button"
                    aria-label="Move up"
                    onClick={() => moveReel(index, -1)}
                    className="rounded-lg border border-border bg-white p-2 text-burgundy hover:bg-white"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    onClick={() => moveReel(index, 1)}
                    className="rounded-lg border border-border bg-white p-2 text-burgundy hover:bg-white"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove reel"
                    onClick={() => setReels((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave()}
          className="rounded-lg bg-burgundy px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Instagram settings"}
        </button>
      </div>
    </div>
  );
}
