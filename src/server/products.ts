import { createServerFn } from "@tanstack/react-start";

import type { ShopCategory } from "@/lib/site-data";
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
    category: row.category as ShopCategory,
    price: Number(row.price),
    stock: row.stock,
    description: row.description,
    image: row.image,
    rating: Number(row.rating),
    badge: row.badge ?? undefined,
    featured: Boolean(row.featured),
    cartPrice: row.cart_price != null ? Number(row.cart_price) : undefined,
    cartSubtitle: row.cart_subtitle ?? undefined,
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

type ProductInput = {
  id?: string;
  name: string;
  sku: string;
  category: ShopCategory;
  price: number;
  stock: number;
  description: string;
  image: string;
  rating?: number;
  badge?: string;
  featured?: boolean;
  cartPrice?: number;
  cartSubtitle?: string;
};

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
    const id = data.id ?? slugify(data.name);
    const extra = JSON.stringify({});

    await execute(
      `INSERT INTO products (
        id, name, sku, category, price, stock, description, image, rating,
        badge, featured, cart_price, cart_subtitle, extra_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.sku,
        data.category,
        data.price,
        data.stock,
        data.description,
        data.image,
        data.rating ?? 4.5,
        data.badge ?? null,
        data.featured ?? false,
        data.cartPrice ?? null,
        data.cartSubtitle ?? null,
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
    await execute(
      `UPDATE products SET
        name = ?, sku = ?, category = ?, price = ?, stock = ?,
        description = ?, image = ?, rating = ?, badge = ?, featured = ?,
        cart_price = ?, cart_subtitle = ?
      WHERE id = ?`,
      [
        patch.name ?? existing.name,
        patch.sku ?? existing.sku,
        patch.category ?? existing.category,
        patch.price ?? existing.price,
        patch.stock ?? existing.stock,
        patch.description ?? existing.description,
        patch.image ?? existing.image,
        patch.rating ?? existing.rating,
        patch.badge ?? existing.badge,
        patch.featured ?? existing.featured,
        patch.cartPrice ?? existing.cart_price,
        patch.cartSubtitle ?? existing.cart_subtitle,
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
