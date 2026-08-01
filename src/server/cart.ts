import { createServerFn } from "@tanstack/react-start";

import type { CartDto, StoredCartItem } from "@/server/cart-types";
import { execute, queryOne } from "@/server/db";
import { mapProductRow, type ProductRow } from "@/server/products";
import { getUserProfileByEmail } from "@/server/users";
import type { ShopProduct } from "@/lib/site-data";
import { getShopProduct } from "@/lib/site-data";

interface CartRow {
  owner_key: string;
  items_json: string;
}

function parseItems(raw: string | unknown): StoredCartItem[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StoredCartItem =>
        typeof item === "object" &&
        item !== null &&
        typeof item.productId === "string" &&
        typeof item.quantity === "number",
    );
  } catch {
    return [];
  }
}

async function loadCart(ownerKey: string): Promise<StoredCartItem[]> {
  const row = await queryOne<CartRow>(
    "SELECT owner_key, items_json FROM carts WHERE owner_key = ?",
    [ownerKey],
  );
  if (!row) return [];
  return parseItems(row.items_json);
}

async function saveCart(ownerKey: string, items: StoredCartItem[]) {
  await execute(
    `INSERT INTO carts (owner_key, items_json) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE items_json = VALUES(items_json), updated_at = CURRENT_TIMESTAMP`,
    [ownerKey, JSON.stringify(items)],
  );
}

async function hydrateProduct(productId: string): Promise<ShopProduct | null> {
  const row = await queryOne<ProductRow>("SELECT * FROM products WHERE id = ?", [productId]);
  if (row) return mapProductRow(row);
  return getShopProduct(productId) ?? null;
}

export const fetchCart = createServerFn({ method: "GET" })
  .validator((data: { guestId?: string }) => data)
  .handler(async ({ data }): Promise<CartDto> => {
    const { resolveSessionUser } = await import("@/server/session-resolve");
    const sessionUser = await resolveSessionUser();
    const ownerKey = sessionUser
      ? `user:${sessionUser.id}`
      : data.guestId
        ? `guest:${data.guestId}`
        : "guest:anonymous";

    const items = await loadCart(ownerKey);
    return { ownerKey, items };
  });

export const saveCartItems = createServerFn({ method: "POST" })
  .validator((data: { guestId?: string; items: StoredCartItem[] }) => data)
  .handler(async ({ data }): Promise<CartDto> => {
    const { resolveSessionUser } = await import("@/server/session-resolve");
    const sessionUser = await resolveSessionUser();
    const ownerKey = sessionUser
      ? `user:${sessionUser.id}`
      : data.guestId
        ? `guest:${data.guestId}`
        : "guest:anonymous";

    const items = data.items.map((item) => ({
      productId: item.productId,
      quantity: Math.max(1, item.quantity),
      size: item.size ?? "",
      colorId: item.colorId ?? "default",
      subtitle: item.subtitle ?? "",
      linePrice: item.linePrice,
    }));

    await saveCart(ownerKey, items);
    return { ownerKey, items };
  });

export const clearCartItems = createServerFn({ method: "POST" })
  .validator((data: { guestId?: string }) => data)
  .handler(async ({ data }) => {
    const { resolveSessionUser } = await import("@/server/session-resolve");
    const sessionUser = await resolveSessionUser();
    const ownerKey = sessionUser
      ? `user:${sessionUser.id}`
      : data.guestId
        ? `guest:${data.guestId}`
        : "guest:anonymous";

    await execute("DELETE FROM carts WHERE owner_key = ?", [ownerKey]);
    return { ok: true };
  });

export const hydrateCartProducts = createServerFn({ method: "POST" })
  .validator((data: { items: StoredCartItem[] }) => data)
  .handler(async ({ data }) => {
    const hydrated = [];
    for (const item of data.items) {
      const product = await hydrateProduct(item.productId);
      if (!product) continue;
      hydrated.push({
        product,
        quantity: item.quantity,
        size: item.size,
        colorId: item.colorId,
        subtitle: item.subtitle,
        linePrice: item.linePrice,
      });
    }
    return hydrated;
  });

export const fetchProfileForEmail = createServerFn({ method: "GET" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email) return null;
    return await getUserProfileByEmail(email);
  });
