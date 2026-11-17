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
import { PageViewAuditor } from "@/components/PageViewAuditor";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { InventoryProvider } from "@/lib/inventory-store";
import { OrdersProvider } from "@/lib/orders-store";
import { emptyAccountStatus, isStaticSite } from "@/lib/static-site";
import { siteConfig } from "@/lib/site-data";
import { buildPageHead, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { getAccountStatus } from "@/server/auth0";
import { getSessionUser } from "@/server/session";
import { JsonLd } from "@/components/JsonLd";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="font-serif text-6xl text-burgundy">404</p>
        <p className="mt-3 text-muted-foreground">
          We couldn&apos;t find the page you&apos;re looking for.
        </p>
        <Link to="/" className="mt-6 inline-block bg-burgundy px-6 py-3 text-sm text-white">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function AppErrorComponent({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl text-burgundy">
          We couldn&apos;t load this page.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Please try again, or return to the home page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-burgundy px-5 py-3 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <Link
            to="/"
            className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    if (isStaticSite) {
      return { accountStatus: emptyAccountStatus, sessionUser: null };
    }

    try {
      const [accountStatus, sessionUser] = await Promise.all([
        getAccountStatus(),
        getSessionUser(),
      ]);
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
  head: () => {
    const seo = buildPageHead({
      title: `${siteConfig.name} — ${siteConfig.title}`,
      description: siteConfig.description,
      path: "/",
      image: siteConfig.logo,
      keywords: [
        "Rachel Paradise",
        "handcrafted jewelry",
        "custom bracelets",
        "bead jewelry India",
        "premium beads",
      ],
    });
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        ...seo.meta,
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: siteConfig.logoIcon, type: "image/png" },
        { rel: "apple-touch-icon", href: siteConfig.logoIcon },
        ...seo.links,
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Reem+Kufi+Fun:wght@400;500;600;700&display=swap",
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  errorComponent: AppErrorComponent,
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
              <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
              <ClientSessionSync />
              <PageViewAuditor />
              <Outlet />
              <CartDrawer />
            </CartProvider>
          </OrdersProvider>
        </InventoryProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
