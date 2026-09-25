import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import { ProfileAvatar } from "@/components/auth/ProfileAvatar";
import { SignOutButton } from "@/components/auth/SignOutLink";
import { useAuth } from "@/lib/auth";
import { clientUserFromAccountStatus, clientUserFromSessionUser } from "@/lib/client-user";
import {
  formatOrderDate,
  orderStatusLabels,
  orderStatusStyles,
  type StoredOrder,
} from "@/lib/orders-store";
import { formatPrice, siteConfig } from "@/lib/site-data";
import { buildPageHead } from "@/lib/seo";
import { getAccountPageData } from "@/server/account-page";
import { fetchProfileForEmail } from "@/server/cart";
import { listMyOrders } from "@/server/orders";
import { saveAccountProfile } from "@/server/profile";
import type { AccountProfileDto } from "@/server/user-types";
import { cn } from "@/lib/utils";
import { emptyAccountStatus, isStaticSite } from "@/lib/static-site";

export const Route = createFileRoute("/account")({
  head: () =>
    buildPageHead({
      title: `My Account`,
      description: `Manage your ${siteConfig.brandName} account and profile.`,
      path: "/account",
      noIndex: true,
    }),
  loader: async () => {
    if (isStaticSite) {
      return {
        authStatus: emptyAccountStatus,
        sessionUser: null,
        profile: null,
        myOrders: [] as StoredOrder[],
      };
    }

    return getAccountPageData();
  },
  component: AccountPage,
});

function AccountPage() {
  const {
    authStatus,
    sessionUser: loaderSessionUser,
    profile: loaderProfile,
    myOrders: loaderOrders,
  } = Route.useLoaderData();
  const navigate = useNavigate();
  const { clientUser, applyClientUser } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  const [profile, setProfile] = useState<AccountProfileDto | null>(loaderProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<StoredOrder[]>(loaderOrders ?? []);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const sessionUser =
    (loaderSessionUser ? clientUserFromSessionUser(loaderSessionUser) : null) ??
    clientUserFromAccountStatus(authStatus) ??
    clientUser;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (sessionUser) applyClientUser(sessionUser);
  }, [sessionUser, applyClientUser]);

  useEffect(() => {
    if (!hydrated) return;
    if (!sessionUser) {
      navigate({ to: "/login" });
    }
  }, [hydrated, sessionUser, navigate]);

  useEffect(() => {
    setMyOrders(loaderOrders ?? []);
  }, [loaderOrders]);

  useEffect(() => {
    if (!hydrated || !sessionUser || isStaticSite) return;
    // Loader already fetched; refresh once on client in case session hydrated late.
    if ((loaderOrders?.length ?? 0) > 0) return;
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError(null);
    void listMyOrders()
      .then((rows) => {
        if (!cancelled) setMyOrders(rows as StoredOrder[]);
      })
      .catch((err) => {
        if (!cancelled) {
          setMyOrders([]);
          setOrdersError(err instanceof Error ? err.message : "Could not load orders.");
        }
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, sessionUser, loaderOrders]);

  useEffect(() => {
    if (loaderProfile) {
      setProfile(loaderProfile);
      return;
    }
    if (sessionUser?.email) {
      fetchProfileForEmail({ data: { email: sessionUser.email } })
        .then((p) => {
          if (p) {
            setProfile({
              ...p,
              image: sessionUser.image ?? p.image,
            });
          } else if (sessionUser) {
            setProfile({
              name: sessionUser.name,
              email: sessionUser.email,
              phone: "",
              shippingStreet: "",
              shippingCity: "",
              shippingZip: "",
              image: sessionUser.image ?? null,
            });
          }
        })
        .catch(() => {});
    }
  }, [loaderProfile, sessionUser]);

  if (!sessionUser) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
          {hydrated ? "Redirecting to sign in…" : "Loading…"}
        </div>
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
          Loading your profile…
        </div>
      </PageLayout>
    );
  }

  const avatarUser = {
    id: sessionUser?.id ?? profile.email,
    name: profile.name,
    email: profile.email,
    image: profile.image,
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await saveAccountProfile({
        data: {
          name: profile.name,
          phone: profile.phone,
          shippingStreet: profile.shippingStreet,
          shippingCity: profile.shippingCity,
          shippingZip: profile.shippingZip,
        },
      });
      setProfile(updated);
      applyClientUser({
        id: sessionUser?.id ?? updated.email,
        name: updated.name,
        email: updated.email,
        image: updated.image,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-8 md:py-16">
        <div className="flex items-start gap-4">
          <ProfileAvatar user={avatarUser} className="size-16" iconClassName="size-7" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-burgundy/70">
              {siteConfig.name} member
            </p>
            <h1 className="font-serif text-3xl text-burgundy md:text-4xl">Your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Profile, shipping details, and your orders.
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-2 border-b border-border">
          <a
            href="#orders"
            className="border-b-2 border-burgundy px-4 py-2 text-sm font-semibold text-burgundy"
          >
            My orders
          </a>
          <a
            href="#profile"
            className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-burgundy"
          >
            Profile
          </a>
        </div>

        <section
          id="orders"
          className="mt-8 scroll-mt-24 rounded-2xl border border-border bg-white p-6 shadow-sm"
        >
          <h2 className="font-serif text-xl text-burgundy">My orders</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Orders placed while signed in with this account.
          </p>
          {ordersLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading orders…</p>
          ) : ordersError ? (
            <p className="mt-6 text-sm text-red-700">{ordersError}</p>
          ) : myOrders.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No orders yet for <span className="font-medium text-foreground">{profile.email}</span>.{" "}
              <Link to="/shop" search={{ q: "" }} className="text-burgundy hover:underline">
                Browse the shop
              </Link>
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {myOrders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-xl border border-border bg-blush-section/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatOrderDate(order.createdAt)}
                      </p>
                      {order.payment?.razorpayPaymentId ? (
                        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                          Payment ID: {order.payment.razorpayPaymentId}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-burgundy">{formatPrice(order.total)}</p>
                      <span
                        className={cn(
                          "mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          orderStatusStyles[order.status],
                        )}
                      >
                        {orderStatusLabels[order.status]}
                      </span>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {order.items.map((item, idx) => (
                      <li key={`${order.id}-${idx}`}>
                        {item.name} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form id="profile" onSubmit={handleSave} className="mt-10 scroll-mt-24 space-y-8">
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl text-burgundy">Personal details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Used on packing slips and bespoke order correspondence.
            </p>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Full name
                </span>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email
                </span>
                <input
                  type="email"
                  readOnly
                  value={profile.email}
                  className="mt-2 w-full rounded-xl border border-border bg-blush-section/50 px-4 py-3 text-sm text-muted-foreground outline-none"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Order confirmations are sent to this address.
                </p>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl text-burgundy">Contact</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              For delivery updates and appointment reminders.
            </p>
            <label className="mt-6 block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Mobile number
              </span>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                placeholder="+44 7XXX XXXXXX"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl text-burgundy">Delivery address</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pre-fills checkout for handcrafted pieces and bead orders.
            </p>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Street address
                </span>
                <input
                  type="text"
                  value={profile.shippingStreet}
                  onChange={(e) => setProfile({ ...profile, shippingStreet: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                  placeholder="House name, street, area"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    City
                  </span>
                  <input
                    type="text"
                    value={profile.shippingCity}
                    onChange={(e) => setProfile({ ...profile, shippingCity: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                    placeholder="Madurai"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Postal code
                  </span>
                  <input
                    type="text"
                    value={profile.shippingZip}
                    onChange={(e) => setProfile({ ...profile, shippingZip: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                    placeholder="W1S 3PR"
                  />
                </label>
              </div>
            </div>
          </section>

          {error && (
            <p className="rounded-xl border border-burgundy/20 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
              {error}
            </p>
          )}
          {saved && (
            <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Profile saved. Your details will be used on your next order.
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "inline-flex rounded-lg bg-burgundy px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:opacity-90",
                saving && "opacity-60",
              )}
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>

        <div className="relative z-20 mt-8 flex flex-col gap-3 pb-24 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-blush-section"
          >
            Continue shopping
          </Link>
          <SignOutButton />
        </div>

        <p className="relative z-10 mt-4 text-center text-xs text-muted-foreground">
          Visit our studio at {siteConfig.studio.address} · {siteConfig.studio.hours}
        </p>
      </div>
    </PageLayout>
  );
}
