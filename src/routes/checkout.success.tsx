import { createFileRoute, Link } from "@tanstack/react-router";
import { Instagram, Linkedin } from "lucide-react";
import { useEffect, useState } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import {
  formatIntention,
  loadConfirmedOrder,
  type ConfirmedOrder,
} from "@/lib/order-confirmation";
import { formatPrice, siteConfig } from "@/lib/site-data";

const JOURNAL_IMAGE =
  "https://images.unsplash.com/photo-1615485500834-bc10199bc4c5?w=1600&h=700&fit=crop";

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export const Route = createFileRoute("/checkout/success")({
  head: () => ({
    meta: [{ title: `Thank You — ${siteConfig.name}` }],
  }),
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);

  useEffect(() => {
    setOrder(loadConfirmedOrder());
  }, []);

  if (!order) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center md:px-8">
          <h1 className="font-serif text-3xl text-burgundy">No recent order found</h1>
          <p className="mt-4 text-muted-foreground">
            Complete a purchase to see your confirmation here.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex bg-burgundy px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:opacity-90"
          >
            Continue Shopping
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
        <header className="text-center">
          <h1 className="font-serif text-4xl text-burgundy md:text-5xl">
            Thank You for Your Order!
          </h1>
          <p className="mt-4 text-muted-foreground">
            Your beads are being hand-strung with intention.
          </p>
          <p className="mt-6 inline-block rounded-full bg-blush-card px-5 py-2 text-sm font-semibold tracking-wide text-burgundy">
            ORDER #{order.orderNumber}
          </p>
        </header>

        <div className="mt-10 rounded-3xl bg-blush-card/70 p-6 md:p-8">
          <div className="flex flex-col gap-4 border-b border-burgundy/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Estimated Delivery
              </p>
              <p className="mt-2 font-serif text-xl text-foreground md:text-2xl">
                {order.estimatedDelivery}
              </p>
            </div>
            <p className="text-sm text-muted-foreground sm:text-right">{order.deliveryLabel}</p>
          </div>

          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Order Summary
            </p>
            <ul className="mt-5 space-y-6">
              {order.items.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex gap-4">
                  <img
                    src={item.image}
                    alt=""
                    className="size-16 shrink-0 rounded-xl object-cover md:size-20"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatIntention(item.subtitle)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-foreground">
                          {formatPrice(item.linePrice * item.quantity)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <dl className="mt-8 space-y-3 border-t border-burgundy/10 pt-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-medium">
                {order.shipping === 0 ? "Complimentary" : formatPrice(order.shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-burgundy/10 pt-4 text-base">
              <dt className="font-semibold text-foreground">Total</dt>
              <dd className="font-serif text-xl font-semibold text-burgundy">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/contact"
            className="inline-flex min-w-[200px] justify-center rounded-full bg-burgundy px-10 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
          >
            Track Your Order
          </Link>
          <Link
            to="/shop"
            className="inline-flex min-w-[200px] justify-center rounded-full border-2 border-burgundy px-10 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-burgundy transition-colors hover:bg-burgundy/5"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Share your intention */}
      <section className="bg-blush-section py-16 md:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center md:px-8">
          <h2 className="font-serif text-3xl text-burgundy md:text-4xl">Share your intention</h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            We&apos;d love to see how your {siteConfig.brandName} beads inspire your journey. Tag us
            for a chance to be featured in our curated gallery.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-burgundy/70 transition-colors hover:text-burgundy"
            >
              <Instagram className="size-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="text-burgundy/70 transition-colors hover:text-burgundy"
            >
              <TwitterIcon className="size-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-burgundy/70 transition-colors hover:text-burgundy"
            >
              <Linkedin className="size-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Connect Us */}
      <section className="relative overflow-hidden">
        <img src={JOURNAL_IMAGE} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
        <div className="relative mx-auto max-w-2xl px-4 py-20 text-center md:px-8 md:py-28">
          <h2 className="font-serif text-3xl text-burgundy md:text-4xl">Connect Us</h2>
          <p className="mt-5 font-serif text-lg leading-relaxed text-burgundy/80">
            Receive curated inspirations, early access to new collections, and stories from our
            studio.
          </p>
          <form className="mt-10" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="success-email" className="sr-only">Email</label>
            <input
              id="success-email"
              type="email"
              placeholder="Your Email Address"
              className="w-full border-0 border-b-2 border-burgundy/30 bg-transparent py-3 text-center font-serif text-burgundy placeholder:text-burgundy/50 outline-none focus:border-burgundy"
            />
            <button
              type="submit"
              className="mt-8 w-full max-w-xs bg-burgundy px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:opacity-90"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </PageLayout>
  );
}
