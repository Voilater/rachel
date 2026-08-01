import bcrypt from "bcryptjs";
import { createServerFn } from "@tanstack/react-start";

import { execute, queryOne } from "@/server/db";
import type { AccountProfileDto, ClientUserDto } from "@/server/user-types";

export type { AccountProfileDto, ClientUserDto } from "@/server/user-types";

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone?: string | null;
  shipping_street?: string | null;
  shipping_city?: string | null;
  shipping_zip?: string | null;
}

function mapProfile(row: UserRow, image: string | null = null): AccountProfileDto {
  return {
    name: row.name,
    email: row.email,
    phone: row.phone?.trim() ?? "",
    shippingStreet: row.shipping_street?.trim() ?? "",
    shippingCity: row.shipping_city?.trim() ?? "",
    shippingZip: row.shipping_zip?.trim() ?? "",
    image,
  };
}

export async function getUserProfileByEmail(email: string): Promise<AccountProfileDto | null> {
  const row = await queryOne<UserRow>("SELECT * FROM users WHERE email = ?", [
    email.trim().toLowerCase(),
  ]);
  return row ? mapProfile(row) : null;
}

export async function updateUserProfile(input: {
  email: string;
  name: string;
  phone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingZip: string;
}): Promise<AccountProfileDto> {
  const email = input.email.trim().toLowerCase();
  const existing = await queryOne<UserRow>("SELECT * FROM users WHERE email = ?", [email]);

  if (!existing) {
    throw new Error("Account not found. Please sign in again.");
  }

  await execute(
    `UPDATE users SET name = ?, phone = ?, shipping_street = ?, shipping_city = ?, shipping_zip = ? WHERE email = ?`,
    [
      input.name.trim(),
      input.phone || null,
      input.shippingStreet || null,
      input.shippingCity || null,
      input.shippingZip || null,
      email,
    ],
  );

  const row = await queryOne<UserRow>("SELECT * FROM users WHERE email = ?", [email]);
  if (!row) throw new Error("Could not save profile.");

  return mapProfile(row);
}

function mapUser(row: UserRow): ClientUserDto {
  return { id: row.id, name: row.name, email: row.email };
}

export async function findOrCreateOAuthUser(input: {
  sub: string;
  name?: string | null;
  email?: string | null;
}): Promise<ClientUserDto | null> {
  const email = input.email?.trim().toLowerCase();
  if (!email) return null;

  const existing = await queryOne<UserRow>("SELECT * FROM users WHERE email = ?", [email]);
  if (existing) return mapUser(existing);

  const safeSub = input.sub.replace(/[^a-zA-Z0-9_-]/g, "_");
  const id = `user_oauth_${safeSub}`;
  const name = input.name?.trim() || email.split("@")[0] || "Guest";
  const passwordHash = await bcrypt.hash(`oauth:${input.sub}:${crypto.randomUUID()}`, 10);

  await execute(
    "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
    [id, name, email, passwordHash],
  );

  return { id, name, email };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<ClientUserDto> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name || !email || input.password.length < 6) {
    throw new Error("Please provide a valid name, email, and password (min 6 characters).");
  }

  const existing = await queryOne<UserRow>("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) {
    if (existing.id.startsWith("user_oauth_")) {
      throw new Error(
        "This email already uses Google sign-in. Please use Sign in with Google below.",
      );
    }
    throw new Error("An account with this email already exists. Please sign in.");
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const passwordHash = await bcrypt.hash(input.password, 10);

  await execute(
    "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
    [id, name, email, passwordHash],
  );

  return { id, name, email };
}

export async function verifyUserCredentials(input: {
  email: string;
  password: string;
}): Promise<ClientUserDto> {
  const email = input.email.trim().toLowerCase();
  const row = await queryOne<UserRow>("SELECT * FROM users WHERE email = ?", [email]);

  if (!row || !(await bcrypt.compare(input.password, row.password_hash))) {
    if (row?.id.startsWith("user_oauth_")) {
      throw new Error("This email uses Google sign-in. Please use Sign in with Google below.");
    }
    throw new Error("Invalid email or password.");
  }

  return mapUser(row);
}

export const signupUser = createServerFn({ method: "POST" })
  .validator((data: { name: string; email: string; password: string }) => data)
  .handler(async ({ data }) => registerUser(data));

export const loginUser = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { authenticateUser } = await import("@/server/users-auth.server");
    return authenticateUser(data);
  });

export const getUserById = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const row = await queryOne<UserRow>("SELECT * FROM users WHERE id = ?", [data.id]);
    return row ? mapUser(row) : null;
  });
