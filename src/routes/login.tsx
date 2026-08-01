import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthSplitLayout, loginHeroImage } from "@/components/auth/AuthSplitLayout";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { serverRedirect } from "@/lib/server-redirect";
import { siteConfig } from "@/lib/site-data";
import { authenticateUser } from "@/server/users-auth.server";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: `Login — ${siteConfig.name}` }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    registered: search.registered === "1" || search.registered === true,
    email: typeof search.email === "string" ? search.email : "",
    error: typeof search.error === "string" ? search.error : "",
  }),
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const form = await request.formData();
        const email = String(form.get("email") ?? "").trim().toLowerCase();
        const password = String(form.get("password") ?? "");

        try {
          await authenticateUser({ email, password });
          return serverRedirect(`${url.origin}/account`);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Could not sign in. Please try again.";
          const params = new URLSearchParams({ error: message, email });
          return serverRedirect(`${url.origin}/login?${params.toString()}`);
        }
      },
    },
  },
  component: LoginPage,
});

function LoginPage() {
  const { registered, email, error } = Route.useSearch();

  return (
    <AuthSplitLayout imagePosition="left" imageSrc={loginHeroImage}>
      <h1 className="font-serif text-3xl text-burgundy md:text-4xl">Welcome Back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Please enter your details to sign in
      </p>

      {registered && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Account created successfully. Please sign in with your email and password.
        </p>
      )}

      <form method="post" action="/login" className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Email Address</span>
          <input
            type="email"
            name="email"
            defaultValue={email}
            autoComplete="email"
            required
            className="mt-2 w-full rounded-lg border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
          />
        </label>

        <div className="block">
          <span className="text-sm font-medium text-foreground">Password</span>
          <div className="relative mt-2">
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-border px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
            />
            <button
              type="button"
              data-password-toggle
              className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-blush-section hover:text-foreground"
              aria-label="Show password"
            >
              <svg
                data-eye-open
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                data-eye-closed
                className="size-4 hidden"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              name="remember"
              className="size-4 rounded border-border accent-[var(--burgundy)]"
            />
            Remember Me
          </label>
          <Link to="/contact" className="text-burgundy hover:underline">Forgot Password?</Link>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-lg bg-burgundy py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:opacity-90"
        >
          Sign In
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleSignInButton callbackUrl="/account" />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-semibold text-burgundy hover:underline">
          Sign Up
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
