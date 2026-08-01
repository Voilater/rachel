import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getSession } from "start-authjs";

import { authConfig, isAuth0Configured } from "@/lib/auth0-config";
import { queryOne } from "@/server/db";
import { findOrCreateOAuthUser } from "@/server/users";

export interface AccountStatus {
  oauthActive: boolean;
  oauthEmail: string | null;
  oauthName: string | null;
  oauthImage: string | null;
  user: Awaited<ReturnType<typeof findOrCreateOAuthUser>>;
  savedToDatabase: boolean;
}

async function withDbTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
  } catch {
    return null;
  }
}

async function resolveAccountStatus(): Promise<AccountStatus> {
  if (!isAuth0Configured()) {
    return {
      oauthActive: false,
      oauthEmail: null,
      oauthName: null,
      oauthImage: null,
      user: null,
      savedToDatabase: false,
    };
  }

  const request = getRequest();
  const session = await getSession(request, authConfig);
  const oauthUser = session?.user;

  if (!oauthUser) {
    return {
      oauthActive: false,
      oauthEmail: null,
      oauthName: null,
      oauthImage: null,
      user: null,
      savedToDatabase: false,
    };
  }

  const email = typeof oauthUser.email === "string" ? oauthUser.email : null;
  const name = typeof oauthUser.name === "string" ? oauthUser.name : null;
  const image = typeof oauthUser.image === "string" ? oauthUser.image : null;
  const sub = typeof oauthUser.sub === "string" ? oauthUser.sub : email ?? oauthUser.id ?? "";

  let user =
    email ? await withDbTimeout(findOrCreateOAuthUser({ sub, name, email })) : null;

  if (!user && typeof oauthUser.id === "string" && oauthUser.id.startsWith("user_")) {
    const row = await withDbTimeout(
      queryOne<{ id: string; name: string; email: string }>(
        "SELECT id, name, email FROM users WHERE id = ?",
        [oauthUser.id],
      ),
    );
    if (row) user = row;
  }

  return {
    oauthActive: true,
    oauthEmail: email,
    oauthName: name,
    oauthImage: image,
    user,
    savedToDatabase: Boolean(user),
  };
}

export const getAccountStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<AccountStatus> => resolveAccountStatus(),
);

export const getAuth0ClientUser = createServerFn({ method: "GET" }).handler(async () => {
  const status = await resolveAccountStatus();
  return status.user;
});

export const hasAuth0Session = createServerFn({ method: "GET" }).handler(async () => {
  const status = await resolveAccountStatus();
  return status.oauthActive;
});
