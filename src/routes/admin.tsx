import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth";
import { useOrders } from "@/lib/orders-store";
import { siteConfig } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const navItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { to: "/admin/inventory", label: "Inventory", icon: Package, exact: false },
] as const;

function AdminNavLink({
  item,
  pathname,
  pendingCount,
  onNavigate,
  className,
}: {
  item: (typeof navItems)[number];
  pathname: string;
  pendingCount: number;
  onNavigate?: () => void;
  className?: string;
}) {
  const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-burgundy text-white"
          : "text-muted-foreground hover:bg-white hover:text-burgundy",
        className,
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
      {item.to === "/admin/orders" && pendingCount > 0 && (
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-xs font-bold",
            active ? "bg-white/25 text-white" : "bg-burgundy text-white",
          )}
        >
          {pendingCount}
        </span>
      )}
    </Link>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdminAuthenticated, adminSession, logoutAdmin } = useAuth();
  const { pendingCount } = useOrders();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isAdminAuthenticated && !isLoginRoute) {
      navigate({ to: "/admin/login" });
    }
  }, [isAdminAuthenticated, isLoginRoute, navigate]);

  // Login is a child route but must not use the authenticated admin shell.
  if (isLoginRoute) {
    return <Outlet />;
  }

  if (!isAdminAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-blush-section">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-burgundy hover:bg-blush-section lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open admin menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate font-serif text-base text-burgundy sm:text-lg">
                {siteConfig.name} Admin
              </p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {adminSession?.name}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:text-burgundy sm:px-3"
            >
              <Store className="size-4" />
              <span className="hidden sm:inline">Store</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                logoutAdmin();
                navigate({ to: "/admin/login" });
              }}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:text-burgundy sm:px-3"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <nav
        className="border-b border-border bg-white lg:hidden"
        aria-label="Admin navigation"
      >
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 md:px-8">
          {navItems.map((item) => (
            <AdminNavLink
              key={item.to}
              item={item}
              pathname={pathname}
              pendingCount={pendingCount}
              className="shrink-0 px-4"
            />
          ))}
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
            aria-label="Close admin menu"
          />
          <nav className="absolute left-0 top-0 flex h-full w-[min(100%,280px)] flex-col bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="font-serif text-lg text-burgundy">Admin menu</p>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close">
                <X className="size-6 text-burgundy" />
              </button>
            </div>
            <ul className="mt-6 space-y-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <AdminNavLink
                    item={item}
                    pathname={pathname}
                    pendingCount={pendingCount}
                    onNavigate={() => setMenuOpen(false)}
                    className="w-full"
                  />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-8 md:py-8">
        <aside className="hidden w-48 shrink-0 lg:block">
          <nav className="sticky top-6 space-y-1">
            {navItems.map((item) => (
              <AdminNavLink
                key={item.to}
                item={item}
                pathname={pathname}
                pendingCount={pendingCount}
              />
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
