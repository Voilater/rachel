import { createServerFn } from "@tanstack/react-start";

export type { AccountProfileDto, ClientUserDto } from "@/server/user-types";

/**
 * Client-safe RPC wrappers. DB helpers live in `users.server.ts` and must be
 * dynamically imported so mysql2 never enters the browser bundle.
 */
export async function getUserProfileByEmail(email: string) {
  const { getUserProfileByEmail: impl } = await import("@/server/users.server");
  return impl(email);
}

export async function updateUserProfile(input: {
  email: string;
  name: string;
  phone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingZip: string;
}) {
  const { updateUserProfile: impl } = await import("@/server/users.server");
  return impl(input);
}

export async function findOrCreateOAuthUser(input: {
  sub: string;
  name?: string | null;
  email?: string | null;
}) {
  const { findOrCreateOAuthUser: impl } = await import("@/server/users.server");
  return impl(input);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const { registerUser: impl } = await import("@/server/users.server");
  return impl(input);
}

export async function verifyUserCredentials(input: {
  email: string;
  password: string;
}) {
  const { verifyUserCredentials: impl } = await import("@/server/users.server");
  return impl(input);
}

export const signupUser = createServerFn({ method: "POST" })
  .validator((data: { name: string; email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { registerUserWithCognito } = await import("@/server/cognito-auth.server");
    return registerUserWithCognito(data);
  });

export const loginUser = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { authenticateUserWithCognito } = await import("@/server/cognito-auth.server");
    return authenticateUserWithCognito(data);
  });

export const getUserById = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { getUserByIdImpl } = await import("@/server/users.server");
    return getUserByIdImpl(data.id);
  });
