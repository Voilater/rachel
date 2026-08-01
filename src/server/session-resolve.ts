import { getRequest } from "@tanstack/react-start/server";
import { getSession } from "start-authjs";

import { authConfig, isAuth0Configured } from "@/lib/auth0-config";
import { readCredentialSession } from "@/server/credential-session";
import { queryOne } from "@/server/db";
import { findOrCreateOAuthUser } from "@/server/users";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  authMethod: "credentials" | "oauth";
}

export async function resolveSessionUser(): Promise<SessionUser | null> {
  const credential = await readCredentialSession();
  if (credential) {
    const row = await queryOne<{ id: string; email: string; name: string }>(
      "SELECT id, name, email FROM users WHERE id = ?",
      [credential.id],
    );
    if (row) {
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        authMethod: "credentials",
      };
    }
  }

  if (!isAuth0Configured()) return null;

  const request = getRequest();
  const session = await getSession(request, authConfig);
  const oauthUser = session?.user;
  if (!oauthUser) return null;

  const email =
    typeof oauthUser.email === "string" ? oauthUser.email.trim().toLowerCase() : null;
  if (!email) return null;

  const name =
    typeof oauthUser.name === "string"
      ? oauthUser.name
      : email.split("@")[0] ?? "Guest";

  const image = typeof oauthUser.image === "string" ? oauthUser.image : null;

  const sub =
    typeof oauthUser.sub === "string"
      ? oauthUser.sub
      : typeof oauthUser.id === "string"
        ? oauthUser.id
        : email;

  const dbUser = await findOrCreateOAuthUser({ sub, name, email });
  if (dbUser) {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image,
      authMethod: "oauth",
    };
  }

  const row = await queryOne<{ id: string; email: string; name: string }>(
    "SELECT id, email, name FROM users WHERE email = ?",
    [email],
  );
  if (row) {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      image,
      authMethod: "oauth",
    };
  }

  return {
    id: typeof oauthUser.id === "string" ? oauthUser.id : email,
    email,
    name,
    image,
    authMethod: "oauth",
  };
}
