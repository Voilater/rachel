import {
  DEFAULT_SHOP_CATEGORIES,
  mergeShopCategories,
  type ShopCategory,
} from "@/lib/shop-categories";
import { execute, queryOne } from "@/server/db";

const SETTINGS_KEY = "shop_categories";

type SettingsRow = {
  setting_key: string;
  value_json: string | string[];
};

function parseCategories(raw: SettingsRow["value_json"]): ShopCategory[] {
  if (!raw) return [];
  let list: unknown = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return mergeShopCategories(
    list.filter((item): item is string => typeof item === "string"),
  );
}

export async function readCustomShopCategories(): Promise<ShopCategory[]> {
  const row = await queryOne<SettingsRow>(
    "SELECT setting_key, value_json FROM site_settings WHERE setting_key = ?",
    [SETTINGS_KEY],
  );
  if (!row) return [];
  return parseCategories(row.value_json);
}

export async function writeCustomShopCategories(categories: ShopCategory[]) {
  const customOnly = mergeShopCategories(categories).filter(
    (c) => !(DEFAULT_SHOP_CATEGORIES as readonly string[]).includes(c),
  );
  await execute(
    `INSERT INTO site_settings (setting_key, value_json)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value_json = VALUES(value_json)`,
    [SETTINGS_KEY, JSON.stringify(customOnly)],
  );
  return customOnly;
}
