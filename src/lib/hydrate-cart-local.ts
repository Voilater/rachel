import type { CartItem } from "@/lib/cart";
import { getShopProduct } from "@/lib/site-data";
import type { StoredCartItem } from "@/server/cart-types";

export function hydrateCartItemsLocal(items: StoredCartItem[]): CartItem[] {
  const result: CartItem[] = [];

  for (const item of items) {
    const product = getShopProduct(item.productId);
    if (!product) continue;

    result.push({
      product,
      quantity: item.quantity,
      size: item.size,
      colorId: item.colorId,
      subtitle: item.subtitle,
      linePrice: item.linePrice,
    });
  }

  return result;
}
