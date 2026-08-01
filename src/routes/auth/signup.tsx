import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    callbackUrl: typeof search.callbackUrl === "string" ? search.callbackUrl : undefined,
  }),
  component: AuthSignupRedirect,
});

function AuthSignupRedirect() {
  const { callbackUrl } = Route.useSearch();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("callbackUrl", callbackUrl ?? "/account");
    params.set("screen_hint", "signup");
    window.location.replace(`/auth/google?${params.toString()}`);
  }, [callbackUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Redirecting to Google…
    </div>
  );
}
