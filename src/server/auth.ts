import { createServerFn } from "@tanstack/react-start";

function adminCredentials() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD ?? "").trim();
  if (!email || !password) {
    throw new Error("Admin login is not configured.");
  }
  return { email, password };
}

export const verifyAdminLogin = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const expected = adminCredentials();
    const attemptEmail = data.email.trim().toLowerCase();
    const attemptPassword = data.password;

    if (attemptEmail !== expected.email || attemptPassword !== expected.password) {
      const { writeAuditLog } = await import("@/server/audit-log.server");
      await writeAuditLog({
        action: "auth.admin.login.failure",
        status: "failure",
        email: attemptEmail,
        message: "Invalid admin credentials",
      });
      throw new Error("Invalid admin credentials.");
    }

    const { writeAuditLog } = await import("@/server/audit-log.server");
    await writeAuditLog({
      action: "auth.admin.login.success",
      status: "success",
      email: expected.email,
      message: "Admin signed in",
    });

    return {
      email: expected.email,
      name: "Studio Admin",
      role: "admin" as const,
    };
  });
