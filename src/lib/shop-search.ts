import type { ShopProduct } from "@/lib/site-data";

export function normalizeSearchQuery(query: string) {
  return query.trim().toLowerCase();
}

export function searchShopProducts(products: ShopProduct[], query: string, limit = 8) {
  const q = normalizeSearchQuery(query);
  if (!q) return [];

  return products
    .filter((product) => {
      const haystack = [
        product.name,
        product.description,
        product.longDescription ?? "",
        product.category,
        product.badge ?? "",
        product.id.replace(/-/g, " "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    })
    .slice(0, limit);
}
