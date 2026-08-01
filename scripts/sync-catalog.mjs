/**
 * Inserts catalog products missing from MySQL.
 * Run after adding home-page or bead products in site-data.
 * Usage: npm run db:sync-catalog
 *
 * Note: uses inline catalog snapshot because Node cannot resolve TS path aliases.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

const config = {
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER ?? "root",
  password: process.env.DATABASE_PASSWORD ?? "",
  database: process.env.DATABASE_NAME ?? "vkstudio",
};

/** Keep in sync with trendingProducts + premiumBeads in src/lib/site-data.ts */
const extraCatalog = [
  {
    id: "aura-layer-necklace",
    name: "The Aura Layer Set",
    price: 245,
    description: "Hand-knotted silk & 18k Gold",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=750&fit=crop&q=80",
    category: "Necklaces",
    badge: "Limited Edition",
    featured: true,
  },
  {
    id: "aura-layer-bracelets",
    name: "The Aura Layer Set",
    price: 245,
    description: "Hand-knotted silk & 18k Gold",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=750&fit=crop&q=80",
    category: "Bracelets",
    badge: "Limited Edition",
    featured: false,
  },
  {
    id: "emerald-cascade",
    name: "Emerald Cascade",
    price: 189,
    description: "Natural Emerald & Vermeil",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=750&fit=crop",
    category: "Necklaces",
    badge: null,
    featured: false,
  },
  {
    id: "petite-pearl-choker",
    name: "Petite Pearl Choker",
    price: 120,
    description: "Freshwater Pearl & 14k Gold",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=750&fit=crop",
    category: "Necklaces",
    badge: null,
    featured: false,
  },
  {
    id: "lapis-lazuli",
    name: "Lapis Lazuli",
    price: 45,
    description:
      "Premium Lapis Lazuli — sold per strand. Ideal for custom bracelets, necklaces, and artisan projects.",
    image: "/images/philosophy.jpg",
    category: "DIY Kits",
    badge: "Premium Bead",
    featured: false,
    cartSubtitle: "per strand",
  },
  {
    id: "moonstone",
    name: "Moonstone",
    price: 62,
    description:
      "Premium Moonstone — sold per strand. Ideal for custom bracelets, necklaces, and artisan projects.",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop",
    category: "DIY Kits",
    badge: "Premium Bead",
    featured: false,
    cartSubtitle: "per strand",
  },
  {
    id: "african-turquoise",
    name: "African Turquoise",
    price: 38,
    description:
      "Premium African Turquoise — sold per strand. Ideal for custom bracelets, necklaces, and artisan projects.",
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfac57583?w=500&h=500&fit=crop",
    category: "DIY Kits",
    badge: "Premium Bead",
    featured: false,
    cartSubtitle: "per strand",
  },
  {
    id: "rose-gold-elements",
    name: "Rose Gold Elements",
    price: 12,
    description:
      "Premium Rose Gold Elements — sold per pc. Ideal for custom bracelets, necklaces, and artisan projects.",
    image: "/images/journal.jpg",
    category: "DIY Kits",
    badge: "Premium Bead",
    featured: false,
    cartSubtitle: "per pc",
  },
];

const db = await mysql.createConnection(config);

for (const [index, product] of extraCatalog.entries()) {
  const [rows] = await db.query("SELECT id FROM products WHERE id = ?", [product.id]);
  if (rows.length > 0) {
    console.log(`skip (exists): ${product.id}`);
    continue;
  }

  const sku = `VK-C${String(index + 1).padStart(4, "0")}`;
  await db.execute(
    `INSERT INTO products (
      id, name, sku, category, price, stock, description, image, rating,
      badge, featured, cart_price, cart_subtitle, extra_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.id,
      product.name,
      sku,
      product.category,
      product.price,
      12 + (index % 8),
      product.description,
      product.image,
      4.5,
      product.badge ?? null,
      product.featured ?? false,
      product.price,
      product.cartSubtitle ?? product.description,
      JSON.stringify({}),
    ],
  );
  console.log(`inserted: ${product.id}`);
}

await db.end();
console.log("Catalog sync complete.");
