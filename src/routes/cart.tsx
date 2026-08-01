import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Minus, Plus, Trash2, Truck } from "lucide-react";
import { useState } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import { Price } from "@/components/Price";
import { getCartItemKey, useCart } from "@/lib/cart";
import { computeOrderTotals } from "@/lib/order-totals";
import { siteConfig } from "@/lib/site-data";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: `Your Shopping Bag — ${siteConfig.name}` }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const [promoCode, setPromoCode] = useState("");

  const subtotal = items.reduce((sum, i) => sum + i.linePrice * i.quantity, 0);
  const { shipping, tax, total } = computeOrderTotals(items, "standard");
  const hasFreeShipping = items.length > 0;

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <h1 className="font-serif text-4xl text-burgundy md:text-5xl">Your Shopping Bag</h1>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">Your bag is empty.</p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-burgundy hover:underline"
            >
              Continue Shopping <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-12">
            {/* Line items */}
            <div>
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const key = getCartItemKey(item);
                  return (
                    <li key={key} className="flex gap-5 py-8 first:pt-0">
                      <img
                        src={item.product.image}
                        alt=""
                        className="size-24 shrink-0 rounded-xl object-cover md:size-28"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="font-serif text-xl text-foreground">
                              {item.product.name}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
                          </div>
                          <Price amount={item.linePrice * item.quantity} className="shrink-0" />
                        </div>
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center rounded-lg border border-border">
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="px-3 py-2 text-muted-foreground hover:text-burgundy disabled:opacity-40"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-4" />
                            </button>
                            <span className="min-w-[2rem] text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, item.quantity + 1)}
                              className="px-3 py-2 text-muted-foreground hover:text-burgundy"
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(key)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-burgundy"
                          >
                            <Trash2 className="size-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {hasFreeShipping && (
                <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-blush-card px-4 py-4 text-sm font-medium text-burgundy">
                  <Truck className="size-4 shrink-0" />
                  You&apos;ve unlocked Free Shipping on this order!
                </div>
              )}
            </div>

            {/* Order summary */}
            <aside className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
              <h2 className="font-serif text-2xl text-foreground">Order Summary</h2>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd><Price amount={subtotal} /></dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="font-medium uppercase text-burgundy">Free</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Estimated Tax</dt>
                  <dd><Price amount={tax} /></dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-4">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd><Price amount={total} emphasis className="text-base" /></dd>
                </div>
              </dl>

              <div className="mt-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                />
                <button
                  type="button"
                  className="rounded-lg border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-burgundy hover:bg-muted"
                >
                  Apply
                </button>
              </div>

              <Link
                to="/checkout"
                className="mt-6 flex w-full items-center justify-center bg-burgundy py-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
              >
                Proceed to Checkout
              </Link>

              <Link
                to="/shop"
                className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-burgundy hover:underline"
              >
                Continue Shopping <ArrowRight className="size-4" />
              </Link>
            </aside>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
