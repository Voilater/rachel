import { createServerFn } from "@tanstack/react-start";

import { isValidEmail, normalizeEmail } from "@/lib/form-validation";

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object" || typeof data.email !== "string") {
      throw new Error("Enter a valid email address.");
    }

    const email = normalizeEmail(data.email);
    if (!isValidEmail(email)) {
      throw new Error("Enter a valid email address.");
    }

    try {
      const { execute } = await import("@/server/db");
      await execute(
        "INSERT IGNORE INTO newsletter_subscribers (email) VALUES (?)",
        [email],
      );
    } catch (error) {
      console.error(
        "[newsletter] Unable to save an email subscription",
        error instanceof Error ? error.name : "UnknownError",
      );
      throw new Error(
        "We couldn't save your subscription right now. Please try again.",
      );
    }

    return { subscribed: true };
  });
