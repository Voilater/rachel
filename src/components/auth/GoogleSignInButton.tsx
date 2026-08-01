import { GoogleLogo } from "@/components/auth/GoogleLogo";
import { clearLoggedOutFlag } from "@/lib/logout-state";

interface GoogleSignInButtonProps {
  label?: string;
  callbackUrl?: string;
  mode?: "login" | "signup";
  className?: string;
}

export function GoogleSignInButton({
  label,
  callbackUrl = "/account",
  mode = "login",
  className,
}: GoogleSignInButtonProps) {
  const buttonLabel =
    label ?? (mode === "signup" ? "Sign up with Google" : "Sign in with Google");

  const params = new URLSearchParams({ callbackUrl });
  if (mode === "signup") params.set("screen_hint", "signup");
  const href = `/auth/google?${params.toString()}`;

  return (
    <a
      href={href}
      onClick={() => clearLoggedOutFlag()}
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
