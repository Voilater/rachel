import Google from "@auth/core/providers/google";
import type { JWT } from "@auth/core/jwt";
import type { Profile } from "@auth/core/types";
import type { StartAuthJSConfig } from "start-authjs";

function profileField(profile: Profile | undefined, key: string) {
  if (!profile || typeof profile !== "object") return undefined;
  const value = (profile as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

async function persistOAuthUserFromToken(token: JWT) {
  const email = typeof token.email === "string" ? token.email : undefined;
  if (!email) return null;

  const name = typeof token.name === "string" ? token.name : undefined;
  const sub =
    typeof token.sub === "string"
      ? token.sub
      : typeof token.dbUserId === "string"
        ? token.dbUserId
        : email;

  const { findOrCreateOAuthUser } = await import("@/server/users.server");
  return await findOrCreateOAuthUser({ sub, name, email });
}

function ensureAuthEnv() {
  const base = process.env.APP_BASE_URL?.replace(/\/$/, "");
  if (!process.env.AUTH_URL && base) {
    process.env.AUTH_URL = `${base}/api/auth`;
  }
  if (!process.env.AUTH_SECRET && process.env.AUTH0_SECRET) {
    process.env.AUTH_SECRET = process.env.AUTH0_SECRET;
  }
  if (!process.env.AUTH_TRUST_HOST) {
    process.env.AUTH_TRUST_HOST = "true";
  }
}

ensureAuthEnv();

function googleClientId() {
  return process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
}

function googleClientSecret() {
  return process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
}

function authSecret() {
  return process.env.AUTH_SECRET ?? process.env.AUTH0_SECRET;
}

/** Auth.js — Google OAuth only (no Cognito Hosted UI). */
export const authConfig: StartAuthJSConfig = {
  secret: authSecret(),
  trustHost: true,
  providers: [
    Google({
      clientId: googleClientId(),
      clientSecret: googleClientSecret(),
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "online",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account, user }) {
      const profileEmail = profileField(profile, "email");
      const profileName = profileField(profile, "name");
      const profileSub = profileField(profile, "sub");

      const profilePicture = profileField(profile, "picture");
      if (profilePicture) token.picture = profilePicture;

      if (profileEmail) token.email = profileEmail;
      if (profileName) token.name = profileName;
      if (profileSub) token.sub = profileSub;

      if (!token.email && user?.email) token.email = user.email;
      if (!token.name && user?.name) token.name = user.name;
      if (!token.sub && user?.id) token.sub = user.id;

      if (!token.picture && user?.image) token.picture = user.image;

      if (account && token.email && !token.dbUserId) {
        try {
          const dbUser = await persistOAuthUserFromToken(token);
          if (dbUser) token.dbUserId = dbUser.id;
        } catch (err) {
          console.error("[auth] Could not persist OAuth user to MySQL:", err);
          if (!token.dbUserId && token.sub) {
            token.dbUserId = `user_oauth_${String(token.sub).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
        if (token.dbUserId) session.user.id = token.dbUserId as string;
        else if (token.sub) session.user.id = token.sub as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      const email = user.email ?? profileField(profile, "email");
      if (!email) return;

      const name = user.name ?? profileField(profile, "name");
      const sub = user.id ?? profileField(profile, "sub") ?? email;
      const provider = account?.provider ?? "google";
      const providerAccountId = account?.providerAccountId ?? sub;

      let mysqlMirrored = false;
      let mysqlUserId: string | null = null;
      try {
        const { findOrCreateOAuthUser } = await import("@/server/users.server");
        const dbUser = await findOrCreateOAuthUser({ sub, name, email });
        mysqlMirrored = Boolean(dbUser);
        mysqlUserId = dbUser?.id ?? null;
      } catch (err) {
        console.error("[auth] MySQL user mirror failed:", err);
      }

      let cognitoMirror: { created: boolean } | null = null;
      let cognitoError: string | null = null;
      try {
        const { ensureCognitoUserFromOAuth } = await import(
          "@/server/cognito-auth.server"
        );
        cognitoMirror = await ensureCognitoUserFromOAuth({ email, name, sub });
      } catch (err) {
        cognitoError = err instanceof Error ? err.message : "Cognito mirror failed";
      }

      try {
        const { writeAuditLog } = await import("@/server/audit-log.server");
        await writeAuditLog({
          action: "auth.oauth.signin",
          status: cognitoError && !mysqlMirrored ? "failure" : "success",
          userId: mysqlUserId ?? sub,
          email,
          message: `${provider} OAuth sign-in completed`,
          metadata: {
            provider,
            providerAccountId,
            name,
            isNewUser: Boolean(isNewUser),
            mysqlMirrored,
            mysqlUserId,
            cognitoMirrored: Boolean(cognitoMirror),
            cognitoCreated: cognitoMirror?.created ?? null,
            cognitoError,
            picture: user.image ?? profileField(profile, "picture") ?? null,
          },
        });

        await writeAuditLog({
          action: "auth.google.signin",
          status: "success",
          userId: mysqlUserId ?? sub,
          email,
          message: "Google OAuth sign-in",
          metadata: {
            provider: "google",
            providerAccountId,
            name,
            isNewUser: Boolean(isNewUser),
            mysqlUserId,
            cognitoCreated: cognitoMirror?.created ?? null,
          },
        });
      } catch {
        // ignore audit failures
      }
    },
    async signOut(message) {
      try {
        const { writeAuditLog } = await import("@/server/audit-log.server");
        const token = "token" in message ? message.token : null;
        const session = "session" in message ? message.session : null;
        const email =
          (token && typeof token.email === "string" && token.email) ||
          (session &&
            typeof session === "object" &&
            session &&
            "user" in session &&
            session.user &&
            typeof (session.user as { email?: string }).email === "string" &&
            (session.user as { email: string }).email) ||
          null;
        const userId =
          (token && typeof token.dbUserId === "string" && token.dbUserId) ||
          (token && typeof token.sub === "string" && token.sub) ||
          null;
        await writeAuditLog({
          action: "auth.oauth.signout",
          status: "success",
          email,
          userId,
          message: "OAuth session signed out",
          metadata: { provider: "google" },
        });
      } catch {
        // ignore
      }
    },
  },
};

export function isGoogleOAuthConfigured() {
  return Boolean(authSecret() && googleClientId() && googleClientSecret());
}

export function isOAuthConfigured() {
  return isGoogleOAuthConfigured();
}

/** @deprecated Use isOAuthConfigured — kept for existing imports */
export const isAuth0Configured = isOAuthConfigured;
