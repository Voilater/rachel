import { SignJWT, jwtVerify } from "jose";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

const COOKIE_NAME = "rachelparadise_cred_session";
const LEGACY_COOKIE_NAME = "vk_cred_session";

export interface CredentialSessionUser {
  id: string;
  email: string;
  name: string;
}

function getSecret() {
  const raw =
    process.env.AUTH0_SECRET ??
    process.env.CREDENTIAL_SESSION_SECRET ??
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? "development-only-credential-session-secret"
      : undefined);
  if (!raw) throw new Error("Credential session security is not configured.");
  return new TextEncoder().encode(raw);
}

export async function createCredentialToken(user: CredentialSessionUser) {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function readCredentialSession(): Promise<CredentialSessionUser | null> {
  const token = getCookie(COOKIE_NAME) ?? getCookie(LEGACY_COOKIE_NAME);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.id !== "string" || typeof payload.email !== "string") {
      return null;
    }
    if (!getCookie(COOKIE_NAME)) {
      writeCredentialCookie(token);
      deleteCookie(LEGACY_COOKIE_NAME, { path: "/" });
    }

    return {
      id: payload.id,
      email: payload.email,
      name:
        typeof payload.name === "string"
          ? payload.name
          : (payload.email.split("@")[0] ?? "Guest"),
    };
  } catch {
    return null;
  }
}

export function writeCredentialCookie(token: string) {
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearCredentialCookie() {
  deleteCookie(COOKIE_NAME, { path: "/" });
  deleteCookie(LEGACY_COOKIE_NAME, { path: "/" });
}
