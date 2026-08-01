import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    callbackUrl: typeof search.callbackUrl === "string" ? search.callbackUrl : undefined,
  }),
  component: AuthLoginRedirect,
});

function AuthLoginRedirect() {
  const { callbackUrl } = Route.useSearch();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("callbackUrl", callbackUrl ?? "/account");
    window.location.replace(`/auth/google?${params.toString()}`);
  }, [callbackUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Redirecting to Google…
    </div>
  );
}
