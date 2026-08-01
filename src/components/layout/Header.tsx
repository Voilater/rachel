import { Heart, Menu, ShoppingBag, X } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";

import { ProfileAvatar } from "@/components/auth/ProfileAvatar";
import { HeaderSearch, MobileHeaderSearch } from "@/components/layout/HeaderSearch";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { navLinks } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();
  const { clientUser } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 bg-blush-nav backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:h-16 md:px-8">
          <button
            type="button"
            className="p-2 md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5 text-burgundy" />
          </button>

          <nav
            className="hidden flex-1 items-center justify-center gap-5 md:flex lg:gap-8"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.15em] text-burgundy/75 transition-colors hover:text-burgundy",
                  (pathname === link.to ||
                    (link.to === "/shop" &&
                      (pathname.startsWith("/shop") || pathname === "/cart"))) &&
                    "text-burgundy",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
            <HeaderSearch className="hidden max-w-[200px] md:block lg:max-w-[240px]" />
            <MobileHeaderSearch />
            <button
              type="button"
              aria-label="Wishlist"
              className="p-2 text-burgundy/80 hover:text-burgundy"
            >
              <Heart className="size-5" />
            </button>
            <Link
              to={clientUser ? "/account" : "/login"}
              aria-label={clientUser ? `Account: ${clientUser.name}` : "Account login"}
              className="p-1 text-burgundy/80 hover:text-burgundy"
              title={clientUser?.name}
            >
              <ProfileAvatar user={clientUser} />
            </Link>
            <Link
              to="/cart"
              aria-label="Shopping bag"
              className="relative p-2 text-burgundy/80 hover:text-burgundy"
            >
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span
                  className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-burgundy text-[9px] font-bold text-white"
                >
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <nav className="absolute right-0 top-0 h-full w-[min(100%,300px)] bg-blush-nav p-6 shadow-xl">
            <div className="flex justify-end">
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close">
                <X className="size-6 text-burgundy" />
              </button>
            </div>
            <ul className="mt-6 space-y-1">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-wider text-burgundy hover:bg-white/40"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
