export type ShopCategory = string;

/** Built-in shop categories. Admin can add more at any time. */
export const DEFAULT_SHOP_CATEGORIES = [
  "Bracelets",
  "Chain",
  "Beads",
  "Raw materials",
  "Fancy beads",
  "Earrings",
  "Anti tarnish",
  "Custom",
] as const;

/** @deprecated Use DEFAULT_SHOP_CATEGORIES — kept for existing imports. */
export const SHOP_CATEGORIES: ShopCategory[] = [...DEFAULT_SHOP_CATEGORIES];

/** Map older catalog labels → current categories (DB migration + sync). */
export const LEGACY_CATEGORY_MAP: Record<string, ShopCategory> = {
  Necklaces: "Chain",
  Necklace: "Chain",
  "DIY Kits": "Raw materials",
  "DIY Kit": "Raw materials",
  Brackets: "Bracelets",
  Bracelet: "Bracelets",
  Earring: "Earrings",
  Bead: "Beads",
  "Fancy bead": "Fancy beads",
  "Raw material": "Raw materials",
};

export function normalizeShopCategory(category: string): ShopCategory {
  const trimmed = category.trim();
  if (!trimmed) return "Custom";
  return LEGACY_CATEGORY_MAP[trimmed] ?? trimmed;
}

export function mergeShopCategories(
  ...lists: Array<readonly string[] | undefined>
): ShopCategory[] {
  const seen = new Set<string>();
  const result: ShopCategory[] = [];
  for (const list of lists) {
    if (!list) continue;
    for (const raw of list) {
      const category = normalizeShopCategory(raw);
      const key = category.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(category);
    }
  }
  return result;
}

/** Stock-keeping unit — unique product code for inventory / orders. */
export function generateSku(name: string, existingSkus: Iterable<string> = []): string {
  const base =
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 12) || "ITEM";
  const used = new Set(
    [...existingSkus].map((sku) => sku.trim().toUpperCase()).filter(Boolean),
  );
  let candidate = `VK-${base}`;
  let n = 2;
  while (used.has(candidate.toUpperCase())) {
    candidate = `VK-${base}-${n}`;
    n += 1;
  }
  return candidate;
}
