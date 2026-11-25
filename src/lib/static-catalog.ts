import type { InventoryItem } from "@/lib/inventory-store";
import { allCatalogProducts, type ShopProduct } from "@/lib/site-data";

export function catalogToInventoryItem(product: ShopProduct): InventoryItem {
  return {
    ...product,
    stock: product.stock ?? 12,
    sku: product.sku ?? `RP-${product.id.slice(0, 8).toUpperCase()}`,
  };
}

export const staticInventoryItems: InventoryItem[] = allCatalogProducts.map(
  catalogToInventoryItem,
);
