import { createServerFn } from "@tanstack/react-start";

import { isValidEmail, normalizeEmail } from "@/lib/form-validation";
import { contactSubjects, siteConfig } from "@/lib/site-data";

export const submitContactMessage = createServerFn({ method: "POST" })
  .validator(
    (data: { name: string; email: string; subject: string; message: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    if (
      !data ||
      typeof data !== "object" ||
      typeof data.name !== "string" ||
      typeof data.email !== "string" ||
      typeof data.subject !== "string" ||
      typeof data.message !== "string"
    ) {
      throw new Error("Check the details in your message and try again.");
    }

    const name = data.name.trim();
    const email = normalizeEmail(data.email);
    const message = data.message.trim();

    if (!name || name.length > 100) {
      throw new Error("Enter your name using 1 to 100 characters.");
    }
    if (!isValidEmail(email)) {
      throw new Error("Enter a valid email address.");
    }
    if (!contactSubjects.some((option) => option === data.subject)) {
      throw new Error("Choose a subject for your message.");
    }
    if (message.length < 10 || message.length > 5000) {
      throw new Error("Your message must be between 10 and 5,000 characters.");
    }

    try {
      const { sendContactMessageEmail } = await import("@/server/mail.server");
      await sendContactMessageEmail({
        name,
        email,
        subject: data.subject,
        message,
      });
    } catch (error) {
      console.error(
        "[contact] Unable to deliver a customer message",
        error instanceof Error ? error.name : "UnknownError",
      );
      throw new Error(
        `We couldn't send your message right now. Email us at ${siteConfig.email}.`,
      );
    }

    return { sent: true };
  });
