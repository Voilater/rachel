import Auth0 from "@auth/core/providers/auth0";
import type { JWT } from "@auth/core/jwt";
import type { Profile } from "@auth/core/types";
import type { StartAuthJSConfig } from "start-authjs";

import { GOOGLE_OAUTH_CONNECTION } from "@/lib/google-oauth";
import { findOrCreateOAuthUser } from "@/server/users";

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

function auth0Issuer() {
  const issuer = process.env.AUTH_AUTH0_ISSUER ?? process.env.AUTH0_ISSUER;
  if (issuer) return issuer;
  const domain = process.env.AUTH0_DOMAIN;
  if (!domain) return undefined;
  return domain.startsWith("https://") ? domain : `https://${domain}`;
}

function auth0ClientId() {
  return process.env.AUTH_AUTH0_ID ?? process.env.AUTH0_CLIENT_ID;
}

function auth0ClientSecret() {
  return process.env.AUTH_AUTH0_SECRET ?? process.env.AUTH0_CLIENT_SECRET;
}

function authSecret() {
  return process.env.AUTH_SECRET ?? process.env.AUTH0_SECRET;
}

/** Auth0 social connection name for Google (Dashboard → Authentication → Social). */
export function getGoogleConnectionName() {
  return process.env.AUTH0_GOOGLE_CONNECTION ?? GOOGLE_OAUTH_CONNECTION;
}

/** Auth.js config for Auth0 OAuth (TanStack Start). */
export const authConfig: StartAuthJSConfig = {
  secret: authSecret(),
  trustHost: true,
  providers: [
    Auth0({
      clientId: auth0ClientId(),
      clientSecret: auth0ClientSecret(),
      issuer: auth0Issuer(),
      authorization: {
        params: {
          scope: "openid profile email",
          connection: getGoogleConnectionName(),
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
        const dbUser = await persistOAuthUserFromToken(token);
        if (dbUser) token.dbUserId = dbUser.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
        if (token.dbUserId) session.user.id = token.dbUserId as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, profile }) {
      const email = user.email ?? profileField(profile, "email");
      if (!email) return;

      const name = user.name ?? profileField(profile, "name");
      const sub = user.id ?? profileField(profile, "sub") ?? email;
      await findOrCreateOAuthUser({ sub, name, email });
    },
  },
};

export function isAuth0Configured() {
  return Boolean(authSecret() && auth0ClientId() && auth0ClientSecret() && auth0Issuer());
}
