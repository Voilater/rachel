import { Link } from "@tanstack/react-router";

import { siteConfig } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  imgClassName,
  to = "/",
  onNavigate,
}: {
  className?: string;
  imgClassName?: string;
  to?: "/" | "/admin";
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label={siteConfig.brandName}
    >
      <img
        src={siteConfig.logo}
        alt={siteConfig.brandName}
        className={cn(
          "h-11 w-11 object-contain md:h-12 md:w-12",
          imgClassName,
        )}
      />
    </Link>
  );
}
