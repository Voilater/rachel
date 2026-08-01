import type { ShopProduct } from "@/lib/site-data";

/** Serializable cart line stored in DB / localStorage. */
export interface StoredCartItem {
  productId: string;
  quantity: number;
  size: string;
  colorId: string;
  subtitle: string;
  linePrice: number;
}

export interface CartDto {
  ownerKey: string;
  items: StoredCartItem[];
}

export function cartOwnerKey(userId?: string | null, guestId?: string | null) {
  if (userId) return `user:${userId}`;
  if (guestId) return `guest:${guestId}`;
  return "guest:anonymous";
}

export function storedToCartItem(
  stored: StoredCartItem,
  product: ShopProduct,
): {
  product: ShopProduct;
  quantity: number;
  size: string;
  colorId: string;
  subtitle: string;
  linePrice: number;
} {
  return {
    product,
    quantity: stored.quantity,
    size: stored.size,
    colorId: stored.colorId,
    subtitle: stored.subtitle,
    linePrice: stored.linePrice,
  };
}
