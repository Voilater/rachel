import { markOAuthPending } from "@/components/auth/ClientSessionSync";
import { GoogleLogo } from "@/components/auth/GoogleLogo";
import { clearLoggedOutFlag } from "@/lib/logout-state";

interface GoogleSignInButtonProps {
  label?: string;
  callbackUrl?: string;
  mode?: "login" | "signup";
  className?: string;
}

/** Normal Google OAuth — goes to Google, not Cognito Hosted UI. */
export function GoogleSignInButton({
  label,
  callbackUrl = "/account",
  mode = "login",
  className,
}: GoogleSignInButtonProps) {
  const buttonLabel =
    label ?? (mode === "signup" ? "Sign up with Google" : "Sign in with Google");

  const params = new URLSearchParams({ callbackUrl });
  const href = `/auth/google?${params.toString()}`;

  return (
    <a
      href={href}
      onClick={() => {
        clearLoggedOutFlag();
        markOAuthPending();
        void import("@/lib/client-audit").then(({ logClientAudit }) => {
          logClientAudit("auth.google.click", {
            status: "info",
            message: "Google sign-in started",
            metadata: { mode, callbackUrl, provider: "google" },
          });
        });
      }}
      className={
        className ??
        "flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-blush-section"
      }
    >
      <GoogleLogo className="size-5 shrink-0" />
      <span>{buttonLabel}</span>
    </a>
  );
}
