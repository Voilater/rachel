import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

import { Price } from "@/components/Price";
import { getCartItemKey, useCart } from "@/lib/cart";

export function CartDrawer() {
  const { items, isOpen, closeCart, count } = useCart();

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, i) => sum + i.linePrice * i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={closeCart}
        aria-label="Close shopping bag"
      />
      <aside className="absolute right-0 top-0 flex h-full w-[min(100%,380px)] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-serif text-xl text-burgundy">Your Shopping Bag</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        {count > 0 && (
          <div className="bg-blush-card px-6 py-3 text-center text-xs font-medium text-burgundy">
            You&apos;ve unlocked Free Shipping!
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Your bag is empty. Discover pieces in our shop.
            </p>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={getCartItemKey(item)} className="flex gap-4">
                  <img
                    src={item.product.image}
                    alt=""
                    className="size-16 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.subtitle}</p>
                    <p className="mt-1 text-sm">
                      <Price amount={item.linePrice * item.quantity} emphasis />
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground"> · Qty {item.quantity}</span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <Price amount={subtotal} emphasis />
            </div>
            <Link
              to="/cart"
              onClick={closeCart}
              className="mt-4 flex w-full items-center justify-center border border-burgundy py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-burgundy hover:bg-burgundy/5"
            >
              View Bag
            </Link>
            <Link
              to="/checkout"
              onClick={closeCart}
              className="mt-3 flex w-full items-center justify-center bg-burgundy py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:opacity-90"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
