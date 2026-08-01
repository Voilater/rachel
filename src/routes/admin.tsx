import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Store,
} from "lucide-react";
import { useEffect } from "react";

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

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdminAuthenticated, adminSession, logoutAdmin } = useAuth();
  const { pendingCount } = useOrders();

  const isLoginRoute = pathname === "/admin/login";

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
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg text-burgundy">{siteConfig.name} Admin</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {adminSession?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-burgundy"
            >
              <Store className="size-4" />
              Store
            </Link>
            <button
              type="button"
              onClick={() => {
                logoutAdmin();
                navigate({ to: "/admin/login" });
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-burgundy"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 md:px-8">
        <aside className="w-48 shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active =
                item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-burgundy text-white"
                      : "text-muted-foreground hover:bg-white hover:text-burgundy",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
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
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
