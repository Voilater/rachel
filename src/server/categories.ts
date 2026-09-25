import { createServerFn } from "@tanstack/react-start";

import {
  DEFAULT_SHOP_CATEGORIES,
  mergeShopCategories,
  normalizeShopCategory,
  type ShopCategory,
} from "@/lib/shop-categories";

export const getShopCategoryOptions = createServerFn({ method: "GET" }).handler(
  async () => {
    const { readCustomShopCategories } = await import("@/server/categories.server");
    const { query } = await import("@/server/db");
    const custom = await readCustomShopCategories();
    const rows = await query<{ category: string }>(
      "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category <> ''",
    );
    return mergeShopCategories(
      DEFAULT_SHOP_CATEGORIES,
      custom,
      rows.map((row) => row.category),
    );
  },
);

export const addShopCategory = createServerFn({ method: "POST" })
  .validator((data: { category: string }) => data)
  .handler(async ({ data }) => {
    const category = normalizeShopCategory(data.category);
    if (!category) throw new Error("Category name is required.");

    const { readCustomShopCategories, writeCustomShopCategories } = await import(
      "@/server/categories.server"
    );
    const { query } = await import("@/server/db");
    const custom = await readCustomShopCategories();
    const nextCustom = await writeCustomShopCategories(
      mergeShopCategories(custom, [category]),
    );
    const rows = await query<{ category: string }>(
      "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category <> ''",
    );

    return mergeShopCategories(
      DEFAULT_SHOP_CATEGORIES,
      nextCustom,
      rows.map((row) => row.category),
    ) as ShopCategory[];
  });
