import { useState, type FormEvent } from "react";

import {
  EMAIL_MAX_LENGTH,
  isValidEmail,
  normalizeEmail,
} from "@/lib/form-validation";
import { subscribeToNewsletter } from "@/server/newsletter";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubscribed(false);

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await subscribeToNewsletter({ data: { email: normalizedEmail } });
      setEmail("");
      setSubscribed(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error &&
          submitError.message === "Enter a valid email address."
          ? submitError.message
          : "We couldn't save your subscription right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-10" onSubmit={handleSubmit}>
      <label htmlFor="newsletter-email" className="sr-only">
        Email
      </label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError(null);
          setSubscribed(false);
        }}
        placeholder="Your Email Address"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={EMAIL_MAX_LENGTH}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "newsletter-email-error" : undefined}
        className="w-full border-0 border-b-2 border-burgundy/30 bg-transparent py-3 text-center font-serif text-burgundy placeholder:text-burgundy/50 outline-none focus:border-burgundy"
      />
      {error ? (
        <p
          id="newsletter-email-error"
          role="alert"
          className="mt-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      {subscribed ? (
        <p role="status" className="mt-3 text-sm text-green-800">
          Thanks for subscribing. You&apos;re on the list.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 w-full max-w-xs bg-burgundy px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Subscribing…" : "Subscribe"}
      </button>
      <p className="mt-3 text-xs text-burgundy/80">
        By subscribing, you agree to receive occasional email updates.
      </p>
    </form>
  );
}
