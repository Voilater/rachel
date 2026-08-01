import { User } from "lucide-react";

import type { ClientUser } from "@/lib/client-user";
import { cn } from "@/lib/utils";

export function ProfileAvatar({
  user,
  className,
  iconClassName,
}: {
  user?: ClientUser | null;
  className?: string;
  iconClassName?: string;
}) {
  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        referrerPolicy="no-referrer"
        className={cn("rounded-full object-cover ring-2 ring-burgundy/15", className ?? "size-8")}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-burgundy/10 text-burgundy",
        className ?? "size-8",
      )}
      aria-hidden
    >
      <User className={iconClassName ?? "size-4"} />
    </span>
  );
}
