/**
 * Direct auth test (DB + credential session cookie) — no browser/seroval needed.
 * Usage: node --env-file=.env scripts/test-auth-direct.mjs
 */

import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { SignJWT, jwtVerify } from "jose";

const testEmail = `auth_direct_${Date.now()}@example.com`;
const testPassword = "testpass123";
const testName = "Direct Auth Test";

function getSecret() {
  const raw =
    process.env.AUTH0_SECRET ??
    process.env.CREDENTIAL_SESSION_SECRET ??
    "vk-dev-credential-session-secret";
  return new TextEncoder().encode(raw);
}

async function createCredentialToken(user) {
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

async function readCredentialToken(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return {
    id: String(payload.id),
    email: String(payload.email),
    name: String(payload.name ?? payload.email),
  };
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST ?? "localhost",
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER ?? "admin",
    password: process.env.DATABASE_PASSWORD ?? "admin",
    database: process.env.DATABASE_NAME ?? "vkstudio",
  });

  console.log("Testing signup/login against MySQL...\n");

  const id = `user_${Date.now()}_test`;
  const hash = await bcrypt.hash(testPassword, 10);

  await pool.execute(
    "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
    [id, testName, testEmail, hash],
  );
  console.log("OK: user inserted", testEmail);

  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [testEmail]);
  const row = rows[0];
  const loginOk = await bcrypt.compare(testPassword, row.password_hash);
  if (!loginOk) {
    console.error("FAIL: password compare after signup");
    process.exit(1);
  }
  console.log("OK: password verify after signup");

  const token = await createCredentialToken({
    id: row.id,
    name: row.name,
    email: row.email,
  });
  const session = await readCredentialToken(token);
  if (session.email !== testEmail) {
    console.error("FAIL: credential session token");
    process.exit(1);
  }
  console.log("OK: credential session token", session.email);

  const badLogin = await bcrypt.compare("wrongpass", row.password_hash);
  if (badLogin) {
    console.error("FAIL: wrong password should not match");
    process.exit(1);
  }
  console.log("OK: wrong password rejected");

  await pool.execute("DELETE FROM users WHERE email = ?", [testEmail]);
  await pool.end();

  console.log("\nAll direct auth tests passed.");
  console.log("Dev server: http://localhost:3000 — sign up with a new email to verify in the UI.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
