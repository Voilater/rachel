/**
 * Migrates legacy category names only.
 * Product catalog is Admin/MySQL-owned — this script does NOT insert dummy products.
 * Usage: npm run db:sync-catalog
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

const db = await mysql.createConnection(config);

const legacyMap = {
  Necklaces: "Chain",
  "DIY Kits": "Raw materials",
  Brackets: "Bracelets",
};
for (const [from, to] of Object.entries(legacyMap)) {
  const [result] = await db.execute(
    "UPDATE products SET category = ? WHERE category = ?",
    [to, from],
  );
  if (result.affectedRows) {
    console.log(`migrated category ${from} → ${to}: ${result.affectedRows}`);
  }
}

const [countRows] = await db.query("SELECT COUNT(*) AS count FROM products");
console.log(`products in DB: ${countRows[0].count}`);
console.log("No catalog seed — manage products in Admin Inventory.");

await db.end();
