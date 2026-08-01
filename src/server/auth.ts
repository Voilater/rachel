import { createServerFn } from "@tanstack/react-start";

export const verifyAdminLogin = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const email = process.env.ADMIN_EMAIL ?? "admin@vkstudio.com";
    const password = process.env.ADMIN_PASSWORD ?? "admin123";

    if (data.email.trim().toLowerCase() !== email.toLowerCase() || data.password !== password) {
      throw new Error("Invalid admin credentials.");
    }

    return {
      email: email,
      name: "Studio Admin",
      role: "admin" as const,
    };
  });
