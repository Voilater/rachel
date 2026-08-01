/**
 * End-to-end auth test against running server.
 * Usage: node scripts/test-auth-http.mjs
 *        APP_BASE_URL=http://localhost:4173 node scripts/test-auth-http.mjs
 */

import { fromCrossJSON, toJSONAsync } from "seroval";

const BASE = process.env.APP_BASE_URL ?? "http://localhost:3000";
const SIGNUP_FN = "e7833e145e3ae85d94c2a30dc6150763a252f0b0deab10e6c667dbd04b2c9be4";
const LOGIN_FN = "bfddbb3a161c81892685b0f636162daeb31b35a6a35ad048dcf2feff6e350d16";
const SESSION_FN = "96aaebb50d82c5bfb7b9bf8c3f01c2afa7b765b9988034713e115f94b380b9d9";

const testEmail = `auth_test_${Date.now()}@example.com`;
const testPassword = "testpass123";
const testName = "Auth Test User";

function parseSetCookie(setCookieHeaders) {
  const jar = new Map();
  for (const header of setCookieHeaders) {
    const part = header.split(";")[0];
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    jar.set(part.slice(0, eq), part.slice(eq + 1));
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function callServerFn(functionId, method, data, jar) {
  const url = `${BASE}/_serverFn/${functionId}`;
  const headers = {
    "x-tsr-serverFn": "true",
    accept: "application/json",
    origin: BASE,
    referer: `${BASE}/signup`,
    "sec-fetch-site": "same-origin",
    cookie: cookieHeader(jar),
  };

  let res;
  if (method === "GET") {
    res = await fetch(url, { method: "GET", headers });
  } else {
    headers["content-type"] = "application/json";
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(await toJSONAsync({ data })),
    });
  }

  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie")]
        : [];

  for (const c of setCookies) {
    const parsed = parseSetCookie([c]);
    for (const [k, v] of parsed) jar.set(k, v);
  }

  const text = await res.text();
  let body;
  try {
    body = fromCrossJSON(JSON.parse(text));
  } catch {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { status: res.status, body, ok: res.ok, raw: text };
}

function extractUser(body, raw = "") {
  if (body?.result?.data) return body.result.data;
  if (body?.result && body.result.email) return body.result;
  if (body?.data) return body.data;
  if (body?.id && body?.email) return body;
  const emailMatch = raw.match(
    /\{"t":1,"s":"([^"]+@[^"]+)"/,
  );
  const idMatch = raw.match(/\{"t":1,"s":"(user_[^"]+)"/);
  if (emailMatch && idMatch) {
    return { id: idMatch[1], email: emailMatch[1], name: "Auth Test User" };
  }
  return null;
}

function extractError(body) {
  if (body?.error?.message) return body.error.message;
  if (typeof body?.message === "string") return body.message;
  return JSON.stringify(body).slice(0, 200);
}

async function main() {
  console.log(`Testing auth at ${BASE}\n`);

  const health = await fetch(BASE);
  if (!health.ok) {
    console.error("FAIL: Dev server not reachable. Run: npm run dev");
    process.exit(1);
  }
  console.log("OK: Dev server is up\n");

  const jar = new Map();

  console.log("1. Sign up:", testEmail);
  const signup = await callServerFn(SIGNUP_FN, "POST", {
    name: testName,
    email: testEmail,
    password: testPassword,
  }, jar);

  const signupUser = extractUser(signup.body, signup.raw);
  if (!signup.ok || !signupUser?.email) {
    console.error("FAIL signup:", signup.status, extractError(signup.body), signup.raw?.slice(0, 500));
    process.exit(1);
  }
  console.log("OK signup:", signupUser.email);
  console.log("   Cookie jar:", cookieHeader(jar).includes("vk_cred_session") ? "vk_cred_session set" : "no vk_cred_session");

  console.log("\n2. Get session after signup");
  const sessionAfterSignup = await callServerFn(SESSION_FN, "GET", undefined, jar);
  const sessionUser1 = extractUser(sessionAfterSignup.body, sessionAfterSignup.raw);
  if (!sessionAfterSignup.ok || sessionUser1?.email !== testEmail) {
    console.error("FAIL session after signup:", sessionAfterSignup.status, extractError(sessionAfterSignup.body));
    process.exit(1);
  }
  console.log("OK session:", sessionUser1.email, `(${sessionUser1.authMethod ?? "unknown"})`);

  jar.delete("vk_cred_session");
  console.log("\n3. Login (cleared cookie, fresh login)");
  const login = await callServerFn(LOGIN_FN, "POST", {
    email: testEmail,
    password: testPassword,
  }, jar);

  const loginUser = extractUser(login.body, login.raw);
  if (!login.ok || loginUser?.email !== testEmail) {
    console.error("FAIL login:", login.status, extractError(login.body));
    process.exit(1);
  }
  console.log("OK login:", loginUser.email);

  console.log("\n4. Get session after login");
  const sessionAfterLogin = await callServerFn(SESSION_FN, "GET", undefined, jar);
  const sessionUser2 = extractUser(sessionAfterLogin.body, sessionAfterLogin.raw);
  if (!sessionAfterLogin.ok || sessionUser2?.email !== testEmail) {
    console.error("FAIL session after login:", sessionAfterLogin.status, extractError(sessionAfterLogin.body));
    process.exit(1);
  }
  console.log("OK session:", sessionUser2.email, `(${sessionUser2.authMethod ?? "unknown"})`);

  console.log("\n5. Wrong password rejected");
  const badLogin = await callServerFn(LOGIN_FN, "POST", {
    email: testEmail,
    password: "wrongpassword",
  }, new Map());
  const badUser = extractUser(badLogin.body, badLogin.raw);
  if (badLogin.ok && badUser?.email) {
    console.error("FAIL: wrong password should not succeed");
    process.exit(1);
  }
  console.log("OK wrong password rejected");

  console.log("\nAll auth tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
