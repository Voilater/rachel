/// <reference types="vite/client" />

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { CartDrawer } from "@/components/CartDrawer";
import { ClientSessionSync } from "@/components/auth/ClientSessionSync";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { InventoryProvider } from "@/lib/inventory-store";
import { OrdersProvider } from "@/lib/orders-store";
import { siteConfig } from "@/lib/site-data";
import { getAccountStatus } from "@/server/auth0";
import { getSessionUser } from "@/server/session";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="font-serif text-6xl text-burgundy">404</p>
        <Link to="/" className="mt-6 inline-block bg-burgundy px-6 py-3 text-sm text-white">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      const accountStatus = await getAccountStatus();
      const sessionUser = await getSessionUser();
      return { accountStatus, sessionUser };
    } catch {
      return {
        accountStatus: {
          oauthActive: false,
          oauthEmail: null,
          oauthName: null,
          oauthImage: null,
          user: null,
          savedToDatabase: false,
        },
        sessionUser: null,
      };
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${siteConfig.name} — ${siteConfig.title}` },
      { name: "description", content: siteConfig.description },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Reem+Kufi+Fun:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        <script>
          {`document.addEventListener("click", function (e) {
  var btn = e.target.closest("[data-password-toggle]");
  if (!btn) return;
  e.preventDefault();
  var wrap = btn.closest(".relative");
  if (!wrap) return;
  var input = wrap.querySelector("input");
  if (!input) return;
  var open = btn.querySelector("[data-eye-open]");
  var closed = btn.querySelector("[data-eye-closed]");
  var show = input.type === "password";
  input.type = show ? "text" : "password";
  if (open) open.classList.toggle("hidden", show);
  if (closed) closed.classList.toggle("hidden", !show);
  btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
});`}
        </script>
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { accountStatus, sessionUser } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialAccountStatus={accountStatus} initialSessionUser={sessionUser}>
        <InventoryProvider>
          <OrdersProvider>
            <CartProvider>
              <ClientSessionSync />
              <Outlet />
              <CartDrawer />
            </CartProvider>
          </OrdersProvider>
        </InventoryProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
