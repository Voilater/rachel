import { createServerFn } from "@tanstack/react-start";

import type { SessionUser } from "@/server/session-resolve";

export type { SessionUser };

export const getSessionUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUser | null> => {
    const { resolveSessionUser } = await import("@/server/session-resolve");
    return resolveSessionUser();
  },
);
