import { useMemo } from "react";

import {
  clearLocalAuthStorage,
  markLoggedOut,
} from "@/lib/logout-state";

/** Plain link sign-out — POST sign-out via /auth/logout server page. */
export function SignOutLink({ className }: { className?: string }) {
  const href = useMemo(() => {
    if (typeof window === "undefined") {
      return "/auth/logout?callbackUrl=/login";
    }
    const callback = `${window.location.origin}/login`;
    return `/auth/logout?callbackUrl=${encodeURIComponent(callback)}`;
  }, []);

  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        markLoggedOut();
        clearLocalAuthStorage();
      }}
    >
      Sign out
    </a>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  return (
    <SignOutLink
      className={
        className ??
        "inline-flex min-h-11 min-w-[7rem] cursor-pointer items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-blush-section"
      }
    />
  );
}
