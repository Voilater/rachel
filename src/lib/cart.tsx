import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { hydrateCartItemsLocal } from "@/lib/hydrate-cart-local";
import { isStaticSite } from "@/lib/static-site";
import type { StoredCartItem } from "@/server/cart-types";
import {
  clearCartItems,
  fetchCart,
  hydrateCartProducts,
  saveCartItems,
} from "@/server/cart";

export interface CartItem {
  product: ShopProduct;
  quantity: number;
  size: string;
  colorId: string;
  subtitle: string;
  linePrice: number;
}

const CART_STORAGE_KEY = "vk_cart";
const GUEST_ID_KEY = "vk_guest_id";

function getCartSubtitle(product: ShopProduct, colorId: string): string {
  if (product.cartSubtitle) return product.cartSubtitle;
  if (product.id === "ethereal-rose-bracelet") {
    const color = product.colors?.find((c) => c.id === colorId);
    return `Customized: ${color?.label ?? "Rose"} Quartz, Gold 'L' Initial`;
  }
  return product.description;
}

function getLinePrice(product: ShopProduct): number {
  return product.cartPrice ?? product.price;
}

function itemKey(item: Pick<CartItem, "product" | "size" | "colorId">) {
  return `${item.product.id}-${item.size}-${item.colorId}`;
}

function getGuestId(): string {
  if (typeof localStorage === "undefined") return "anonymous";
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

function readLocalCart(): StoredCartItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items: StoredCartItem[]) {
  if (typeof localStorage === "undefined") return;
  if (items.length === 0) {
    localStorage.removeItem(CART_STORAGE_KEY);
  } else {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }
}

function toStored(item: CartItem): StoredCartItem {
  return {
    productId: item.product.id,
    quantity: item.quantity,
    size: item.size,
    colorId: item.colorId,
    subtitle: item.subtitle,
    linePrice: item.linePrice,
  };
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  ready: boolean;
  addItem: (
    product: ShopProduct,
    options?: {
      size?: string;
      colorId?: string;
      quantity?: number;
      subtitle?: string;
      linePrice?: number;
    },
  ) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const persistCart = useCallback((nextItems: CartItem[]) => {
    const stored = nextItems.map(toStored);
    writeLocalCart(stored);

    if (isStaticSite) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveCartItems({ data: { guestId: getGuestId(), items: stored } }).catch(() => {});
    }, 400);
  }, []);

  const applyHydratedItems = useCallback(
    (hydrated: CartItem[]) => {
      setItems(hydrated);
      itemsRef.current = hydrated;
      writeLocalCart(hydrated.map(toStored));
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const local = readLocalCart();

        if (isStaticSite) {
          if (local.length > 0) {
            applyHydratedItems(hydrateCartItemsLocal(local));
          }
          return;
        }

        const serverCart = await fetchCart({ data: { guestId: getGuestId() } });
        const mergedMap = new Map<string, StoredCartItem>();

        for (const item of serverCart.items) {
          mergedMap.set(`${item.productId}-${item.size}-${item.colorId}`, item);
        }
        for (const item of local) {
          const key = `${item.productId}-${item.size}-${item.colorId}`;
          mergedMap.set(key, item);
        }

        const merged = Array.from(mergedMap.values());
        if (merged.length === 0) {
          if (!cancelled) setReady(true);
          return;
        }

        const hydrated = await hydrateCartProducts({ data: { items: merged } });
        if (!cancelled) {
          applyHydratedItems(hydrated as CartItem[]);
          persistCart(hydrated as CartItem[]);
        }
      } catch {
        const local = readLocalCart();
        if (local.length > 0) {
          try {
            const hydrated = await hydrateCartProducts({ data: { items: local } });
            if (!cancelled) applyHydratedItems(hydrated as CartItem[]);
          } catch {
            // Ignore
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyHydratedItems, persistCart]);

  const addItem = useCallback(
    (
      product: ShopProduct,
      options?: {
        size?: string;
        colorId?: string;
        quantity?: number;
        subtitle?: string;
        linePrice?: number;
      },
    ) => {
      const size = options?.size ?? product.sizes?.[1] ?? "Medium (7.0\")";
      const colorId = options?.colorId ?? product.colors?.[0]?.id ?? "default";
      const quantity = options?.quantity ?? 1;
      const subtitle = options?.subtitle ?? getCartSubtitle(product, colorId);
      const linePrice = options?.linePrice ?? getLinePrice(product);

      setItems((prev) => {
        const key = `${product.id}-${size}-${colorId}`;
        const existing = prev.find((i) => itemKey(i) === key);
        const next = existing
          ? prev.map((i) =>
              itemKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i,
            )
          : [
              ...prev,
              { product, quantity, size, colorId, subtitle, linePrice },
            ];
        persistCart(next);
        return next;
      });
      setIsOpen(true);
    },
    [persistCart],
  );

  const removeItem = useCallback(
    (key: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => itemKey(i) !== key);
        persistCart(next);
        return next;
      });
    },
    [persistCart],
  );

  const updateQuantity = useCallback(
    (key: string, quantity: number) => {
      if (quantity < 1) return;
      setItems((prev) => {
        const next = prev.map((i) => (itemKey(i) === key ? { ...i, quantity } : i));
        persistCart(next);
        return next;
      });
    },
    [persistCart],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    writeLocalCart([]);
    if (!isStaticSite) {
      clearCartItems({ data: { guestId: getGuestId() } }).catch(() => {});
    }
    setIsOpen(false);
  }, []);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      isOpen,
      count,
      ready,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((v) => !v),
    }),
    [
      items,
      isOpen,
      count,
      ready,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function getCartItemKey(item: CartItem) {
  return itemKey(item);
}

export function clearCartStorage() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(GUEST_ID_KEY);
  }
}
