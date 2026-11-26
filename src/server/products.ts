import { createServerFn } from "@tanstack/react-start";

import type { ShopCategory } from "@/lib/shop-categories";
import {
  DEFAULT_PRODUCT_WEIGHT_GRAMS,
  MAX_PRODUCT_WEIGHT_GRAMS,
} from "@/lib/order-totals";
import { normalizeShopCategory } from "@/lib/shop-categories";
import { execute, query, queryOne } from "@/server/db";

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image: string;
  rating: number;
  badge: string | null;
  featured: boolean;
  cart_price: number | null;
  cart_subtitle: string | null;
  weight_grams: number;
  extra_json: string | Record<string, unknown> | null;
}

export interface DbProduct {
  id: string;
  name: string;
  sku: string;
  category: ShopCategory;
  price: number;
  stock: number;
  description: string;
  image: string;
  rating: number;
  badge?: string;
  featured?: boolean;
  cartPrice?: number;
  cartSubtitle?: string;
  weightGrams: number;
  images?: string[];
  longDescription?: string;
  reviewCount?: number;
  sizes?: string[];
  colors?: { id: string; hex: string; label: string }[];
}

function parseExtra(extra: ProductRow["extra_json"]) {
  if (!extra) return {};
  if (typeof extra === "string") {
    try {
      return JSON.parse(extra) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return extra;
}

export function mapProductRow(row: ProductRow): DbProduct {
  const extra = parseExtra(row.extra_json);
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: normalizeShopCategory(row.category),
    price: Number(row.price),
    stock: row.stock,
    description: row.description,
    image: row.image,
    rating: Number(row.rating),
    badge: row.badge ?? undefined,
    featured: Boolean(row.featured),
    cartPrice: row.cart_price != null ? Number(row.cart_price) : undefined,
    cartSubtitle: row.cart_subtitle ?? undefined,
    weightGrams: Number(row.weight_grams) || DEFAULT_PRODUCT_WEIGHT_GRAMS,
    images: extra.images as string[] | undefined,
    longDescription: extra.longDescription as string | undefined,
    reviewCount: extra.reviewCount as number | undefined,
    sizes: extra.sizes as string[] | undefined,
    colors: extra.colors as DbProduct["colors"],
  };
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeProductSku(sku: string) {
  return sku.replace(/^VK-/i, "RP-");
}

type ProductInput = {
  id?: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image: string;
  rating?: number;
  badge?: string;
  featured?: boolean;
  cartPrice?: number;
  cartSubtitle?: string;
  weightGrams: number;
};

function validateProductWeight(weightGrams: number) {
  if (
    !Number.isSafeInteger(weightGrams) ||
    weightGrams < 1 ||
    weightGrams > MAX_PRODUCT_WEIGHT_GRAMS
  ) {
    throw new Error("Enter a product weight between 1 g and 1,000,000 g.");
  }
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await query<ProductRow>("SELECT * FROM products ORDER BY created_at DESC");
  return rows.map(mapProductRow);
});

export const getProductById = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const row = await queryOne<ProductRow>("SELECT * FROM products WHERE id = ?", [data.id]);
    return row ? mapProductRow(row) : null;
  });

export const createProduct = createServerFn({ method: "POST" })
  .validator((data: ProductInput) => data)
  .handler(async ({ data }) => {
    validateProductWeight(data.weightGrams);
    const id = data.id ?? slugify(data.name);
    const extra = JSON.stringify({});

    await execute(
      `INSERT INTO products (
        id, name, sku, category, price, stock, description, image, rating,
        badge, featured, cart_price, cart_subtitle, weight_grams, extra_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        normalizeProductSku(data.sku),
        normalizeShopCategory(data.category),
        data.price,
        data.stock,
        data.description,
        data.image,
        data.rating ?? 4.5,
        data.badge ?? null,
        data.featured ?? false,
        data.cartPrice ?? data.price,
        data.cartSubtitle ?? null,
        data.weightGrams,
        extra,
      ],
    );

    const row = await queryOne<ProductRow>("SELECT * FROM products WHERE id = ?", [id]);
    if (!row) throw new Error("Failed to create product.");
    return mapProductRow(row);
  });

export const updateProductById = createServerFn({ method: "POST" })
  .validator((data: { id: string; patch: Partial<ProductInput> }) => data)
  .handler(async ({ data }) => {
    const existing = await queryOne<ProductRow>("SELECT * FROM products WHERE id = ?", [data.id]);
    if (!existing) throw new Error("Product not found.");

    const patch = data.patch;
    const weightGrams = patch.weightGrams ?? existing.weight_grams;
    validateProductWeight(weightGrams);
    await execute(
      `UPDATE products SET
        name = ?, sku = ?, category = ?, price = ?, stock = ?,
        description = ?, image = ?, rating = ?, badge = ?, featured = ?,
        cart_price = ?, cart_subtitle = ?, weight_grams = ?
      WHERE id = ?`,
      [
        patch.name ?? existing.name,
        normalizeProductSku(patch.sku ?? existing.sku),
        patch.category != null
          ? normalizeShopCategory(patch.category)
          : existing.category,
        patch.price ?? existing.price,
        patch.stock ?? existing.stock,
        patch.description ?? existing.description,
        patch.image ?? existing.image,
        patch.rating ?? existing.rating,
        patch.badge ?? existing.badge,
        patch.featured ?? existing.featured,
        patch.cartPrice ??
          (patch.price !== undefined ? patch.price : existing.cart_price),
        patch.cartSubtitle ?? existing.cart_subtitle,
        weightGrams,
        data.id,
      ],
    );

    const row = await queryOne<ProductRow>("SELECT * FROM products WHERE id = ?", [data.id]);
    if (!row) throw new Error("Product not found.");
    return mapProductRow(row);
  });

export const deleteProductById = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await execute("DELETE FROM products WHERE id = ?", [data.id]);
    return { ok: true };
  });

export const adjustProductStock = createServerFn({ method: "POST" })
  .validator((data: { id: string; delta: number }) => data)
  .handler(async ({ data }) => {
    await execute(
      "UPDATE products SET stock = GREATEST(0, stock + ?) WHERE id = ?",
      [data.delta, data.id],
    );
    const row = await queryOne<ProductRow>("SELECT * FROM products WHERE id = ?", [data.id]);
    if (!row) throw new Error("Product not found.");
    return mapProductRow(row);
  });
