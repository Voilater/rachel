import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import { ProfileAvatar } from "@/components/auth/ProfileAvatar";
import { SignOutButton } from "@/components/auth/SignOutLink";
import { useAuth } from "@/lib/auth";
import { clientUserFromAccountStatus, clientUserFromSessionUser } from "@/lib/client-user";
import { siteConfig } from "@/lib/site-data";
import { getAccountStatus } from "@/server/auth0";
import { getSessionUser } from "@/server/session";
import { fetchProfileForEmail } from "@/server/cart";
import { getAccountProfile, saveAccountProfile } from "@/server/profile";
import type { AccountProfileDto } from "@/server/user-types";
import { cn } from "@/lib/utils";
import { emptyAccountStatus, isStaticSite } from "@/lib/static-site";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: `My Account — ${siteConfig.name}` }],
  }),
  loader: async () => {
    if (isStaticSite) {
      return {
        authStatus: emptyAccountStatus,
        sessionUser: null,
        profile: null,
      };
    }

    const authStatus = await getAccountStatus();
    const sessionUser = await getSessionUser();
    const profile = await getAccountProfile();
    return { authStatus, sessionUser, profile };
  },
  component: AccountPage,
});

function AccountPage() {
  const {
    authStatus,
    sessionUser: loaderSessionUser,
    profile: loaderProfile,
  } = Route.useLoaderData();
  const navigate = useNavigate();
  const { clientUser, applyClientUser } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  const [profile, setProfile] = useState<AccountProfileDto | null>(loaderProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <h1 className="font-serif text-3xl text-burgundy md:text-4xl">Your profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage how we reach you for orders, deliveries, and studio appointments.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-10 space-y-8">
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
                    placeholder="London"
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
