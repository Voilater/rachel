import { SignJWT, jwtVerify } from "jose";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

const COOKIE_NAME = "vk_admin_auth";
const SESSION_MAX_AGE = 60 * 60 * 12;

function getSigningKey() {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.AUTH0_SECRET?.trim() ||
    process.env.CREDENTIAL_SESSION_SECRET?.trim() ||
    (process.env.NODE_ENV !== "production"
      ? process.env.ADMIN_PASSWORD?.trim()
      : undefined);
  if (!secret) {
    throw new Error("Admin session security is not configured.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(email: string) {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSigningKey());

  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function requireAdminSession() {
  const token = getCookie(COOKIE_NAME);
  if (!token) throw new Error("Admin sign-in required.");

  let payload;
  try {
    ({ payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: ["HS256"],
    }));
  } catch {
    throw new Error("Admin session expired. Sign in again.");
  }

  if (payload.role !== "admin" || typeof payload.sub !== "string") {
    throw new Error("Admin sign-in required.");
  }
}

export function clearAdminSession() {
  deleteCookie(COOKIE_NAME, { path: "/" });
}
