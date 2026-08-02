import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import { Price } from "@/components/Price";
import { useAuth } from "@/lib/auth";
import { getCartItemKey, useCart } from "@/lib/cart";
import {
  computeOrderTotals,
  deliveryOptions,
  type DeliveryMethod,
} from "@/lib/order-totals";
import {
  generateOrderNumber,
  getDeliveryLabel,
  getEstimatedDelivery,
  saveConfirmedOrder,
} from "@/lib/order-confirmation";
import { useOrders } from "@/lib/orders-store";
import { isStaticSite } from "@/lib/static-site";
import { openRazorpayCheckout } from "@/lib/pay-with-razorpay";
import { formatPrice, siteConfig } from "@/lib/site-data";
import { getAccountProfile } from "@/server/profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: `Shipping & Payment — ${siteConfig.name}` }],
  }),
  component: CheckoutPage,
});

function StepBadge({ step }: { step: number }) {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-burgundy text-sm font-semibold text-white"
    >
      {step}
    </span>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { clientUser } = useAuth();
  const { appendOrder } = useOrders();
  const [delivery, setDelivery] = useState<DeliveryMethod>("standard");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (clientUser) {
      setFullName(clientUser.name);
    }
    if (isStaticSite) return;

    getAccountProfile()
      .then((profile) => {
        if (!profile) return;
        setFullName(profile.name);
        setPhone(profile.phone);
        setStreet(profile.shippingStreet);
        setCity(profile.shippingCity);
        setZip(profile.shippingZip);
      })
      .catch(() => {});
  }, [clientUser]);

  const { subtotal, shipping, tax, total } = computeOrderTotals(items, delivery);

  const handlePlaceOrder = async () => {
    setError(null);

    if (!fullName.trim() || !street.trim() || !city.trim() || !zip.trim() || !phone.trim()) {
      setError("Please complete your shipping address.");
      return;
    }

    setIsPaying(true);
    try {
      const orderNumber = generateOrderNumber();
      const orderItems = items.map((item) => ({
        name: item.product.name,
        subtitle: item.subtitle,
        image: item.product.image,
        quantity: item.quantity,
        linePrice: item.linePrice,
        productId: item.product.id,
      }));

      const completeDemoOrder = async () => {
        saveConfirmedOrder({
          orderNumber,
          deliveryMethod: delivery,
          deliveryLabel: getDeliveryLabel(delivery),
          estimatedDelivery: getEstimatedDelivery(delivery),
          subtotal,
          shipping,
          tax,
          total,
          items: orderItems,
        });

        if (!isStaticSite) {
          await appendOrder({
            orderNumber,
            customer: {
              userId: clientUser?.id,
              name: fullName.trim(),
              email: clientUser?.email ?? "guest@checkout.local",
              phone: phone.trim(),
              isGuest: !clientUser,
            },
            shippingAddress: {
              street: street.trim(),
              city: city.trim(),
              zip: zip.trim(),
            },
            deliveryMethod: delivery,
            deliveryLabel: getDeliveryLabel(delivery),
            estimatedDelivery: getEstimatedDelivery(delivery),
            subtotal,
            shipping,
            tax,
            total,
            items: orderItems,
          });
        }

        clearCart();
        navigate({ to: "/checkout/success" });
      };

      if (isStaticSite) {
        await completeDemoOrder();
        return;
      }

      await openRazorpayCheckout({
        amount: total,
        receipt: `vk_${Date.now()}`,
        customer: {
          name: fullName.trim(),
          phone: phone.trim(),
        },
        onSuccess: async () => {
          await completeDemoOrder();
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment could not be completed.";
      if (message !== "Payment cancelled.") {
        setError(message);
      }
    } finally {
      setIsPaying(false);
    }
  };

  if (items.length === 0) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center md:px-8">
          <h1 className="font-serif text-3xl text-burgundy">Your bag is empty</h1>
          <p className="mt-4 text-muted-foreground">Add pieces before checkout.</p>
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
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <h1 className="font-serif text-4xl text-burgundy md:text-5xl">Shipping &amp; Payment</h1>
        {clientUser ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-burgundy">{clientUser.email}</span>
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-burgundy hover:underline">
              Sign in
            </Link>
            {" "}for faster checkout and order tracking.
          </p>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-12">
          <div className="space-y-6">
            {/* Shipping address */}
            <section className="rounded-2xl bg-blush-card/60 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <StepBadge step={1} />
                <h2 className="font-serif text-xl text-foreground">Shipping Address</h2>
              </div>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Street Address
                  </span>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="124 Artisan Row"
                    className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      City
                    </span>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Zip / Postal Code
                    </span>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Phone Number
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                  />
                </label>
              </div>
            </section>

            {/* Delivery */}
            <section className="rounded-2xl bg-blush-card/60 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <StepBadge step={2} />
                <h2 className="font-serif text-xl text-foreground">Delivery Method</h2>
              </div>
              <div className="mt-6 space-y-3">
                {deliveryOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDelivery(option.id)}
                    className={cn(
                      "w-full rounded-xl border-2 bg-white p-4 text-left transition-colors",
                      delivery === option.id
                        ? "border-burgundy"
                        : "border-transparent hover:border-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {option.label}{" "}
                          <span className="text-muted-foreground">
                            ({option.price === 0 ? "FREE" : formatPrice(option.price)})
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{option.eta}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{option.note}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Razorpay payment */}
            <section className="rounded-2xl bg-blush-card/60 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <StepBadge step={3} />
                <h2 className="font-serif text-xl text-foreground">Payment Method</h2>
              </div>
              <div className="mt-6 rounded-xl border border-burgundy/20 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">Razorpay</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pay securely with UPI, cards, netbanking &amp; wallets.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-burgundy">
                    <Lock className="size-3.5" />
                    Secure
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  You&apos;ll complete payment in Razorpay&apos;s checkout when you place your
                  order. We never store card details on our servers.
                </p>
              </div>

              <label className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="size-4 rounded border-border text-burgundy focus:ring-burgundy/30"
                />
                Billing address same as shipping
              </label>
            </section>
          </div>

          {/* Order summary */}
          <aside className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8 lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-serif text-2xl text-foreground">Order Summary</h2>
            <ul className="mt-6 space-y-4">
              {items.map((item) => (
                <li key={getCartItemKey(item)} className="flex gap-3">
                  <img
                    src={item.product.image}
                    alt=""
                    className="size-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <Price amount={item.linePrice * item.quantity} className="shrink-0" />
                </li>
              ))}
            </ul>

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

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd><Price amount={subtotal} /></dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium">
                  {shipping === 0 ? "FREE" : <Price amount={shipping} />}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Tax</dt>
                <dd><Price amount={tax} /></dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-4">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd><Price amount={total} emphasis className="text-base" /></dd>
              </div>
            </dl>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <button
              type="button"
              disabled={isPaying}
              onClick={handlePlaceOrder}
              className="mt-6 flex w-full items-center justify-center bg-burgundy py-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPaying ? "Opening Razorpay…" : "Place Order"}
            </button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              By placing an order, you agree to our Terms and Privacy Policy.
            </p>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}
