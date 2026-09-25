import { createServerFn } from "@tanstack/react-start";

import type { InstagramSettings } from "@/lib/instagram-settings";

export const getInstagramSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { readInstagramSettings } = await import("@/server/instagram-settings.server");
  return readInstagramSettings();
});

export const saveInstagramSettings = createServerFn({ method: "POST" })
  .validator((data: Partial<InstagramSettings>) => data)
  .handler(async ({ data }) => {
    const { writeInstagramSettings } = await import("@/server/instagram-settings.server");
    const saved = await writeInstagramSettings(data);
    const { clearInstagramMediaCache } = await import("@/server/instagram");
    clearInstagramMediaCache();
    return saved;
  });
