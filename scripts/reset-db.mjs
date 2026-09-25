/**
 * Drop and recreate a clean MySQL database for local/deploy bootstrap.
 * Usage: npm run db:reset
 *
 * Admin login is NOT stored in MySQL — it uses ADMIN_EMAIL / ADMIN_PASSWORD in .env
 * Customer login uses Cognito (+ optional MySQL user mirror).
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

const dbName = process.env.DATABASE_NAME ?? "vk_studio";
const host = process.env.DATABASE_HOST ?? "localhost";
const port = Number(process.env.DATABASE_PORT ?? 3306);
const appUser = process.env.DATABASE_USER ?? "admin";
const appPassword = process.env.DATABASE_PASSWORD ?? "admin";

/** Prefer root/admin for DROP DATABASE; fall back to app user. */
const rootUser = process.env.DATABASE_ROOT_USER ?? "admin";
const rootPassword = process.env.DATABASE_ROOT_PASSWORD ?? "admin";

async function connectAs(user, password) {
  return mysql.createConnection({ host, port, user, password, multipleStatements: true });
}

async function main() {
  console.log(`\nFresh DB reset → ${host}:${port} / ${dbName}\n`);

  let admin;
  try {
    admin = await connectAs(rootUser, rootPassword);
    console.log(`Connected as ${rootUser}`);
  } catch {
    admin = await connectAs(appUser, appPassword);
    console.log(`Connected as ${appUser} (no root access)`);
  }

  await admin.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await admin.query(
    `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`Recreated database: ${dbName}`);

  // Ensure app user can access the new DB (when connected as root)
  try {
    await admin.query(
      `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${appUser}'@'%'`,
    );
    await admin.query("FLUSH PRIVILEGES");
  } catch {
    // ignore if not root / grants not allowed
  }

  await admin.changeUser({ database: dbName });

  await admin.query(`
    CREATE TABLE users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(32) NULL,
      shipping_street VARCHAR(512) NULL,
      shipping_city VARCHAR(128) NULL,
      shipping_zip VARCHAR(32) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await admin.query(`
    CREATE TABLE carts (
      owner_key VARCHAR(128) PRIMARY KEY,
      items_json JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await admin.query(`
    CREATE TABLE products (
      id VARCHAR(128) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(64) NOT NULL,
      category VARCHAR(64) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      description TEXT,
      image LONGTEXT NOT NULL,
      rating DECIMAL(3, 2) NOT NULL DEFAULT 4.50,
      badge VARCHAR(64) NULL,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      cart_price DECIMAL(10, 2) NULL,
      cart_subtitle VARCHAR(255) NULL,
      extra_json JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await admin.query(`
    CREATE TABLE orders (
      id VARCHAR(64) PRIMARY KEY,
      order_number VARCHAR(32) NOT NULL UNIQUE,
      user_id VARCHAR(64) NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(64) NOT NULL,
      is_guest BOOLEAN NOT NULL DEFAULT TRUE,
      shipping_street VARCHAR(512) NOT NULL,
      shipping_city VARCHAR(128) NOT NULL,
      shipping_zip VARCHAR(32) NOT NULL,
      delivery_method VARCHAR(32) NOT NULL,
      delivery_label VARCHAR(128) NOT NULL,
      estimated_delivery VARCHAR(255) NOT NULL,
      subtotal DECIMAL(10, 2) NOT NULL,
      shipping_cost DECIMAL(10, 2) NOT NULL,
      tax DECIMAL(10, 2) NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      status ENUM('new', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_orders_created (created_at),
      INDEX idx_orders_status (status)
    )
  `);

  await admin.query(`
    CREATE TABLE order_items (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      product_id VARCHAR(128) NULL,
      name VARCHAR(255) NOT NULL,
      subtitle VARCHAR(512) NULL,
      image LONGTEXT NULL,
      quantity INT NOT NULL,
      line_price DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  await admin.query(`
    CREATE TABLE audit_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(128) NOT NULL,
      status ENUM('success', 'failure', 'info') NOT NULL DEFAULT 'info',
      user_id VARCHAR(64) NULL,
      email VARCHAR(255) NULL,
      ip_address VARCHAR(64) NULL,
      user_agent VARCHAR(1024) NULL,
      path VARCHAR(512) NULL,
      method VARCHAR(16) NULL,
      message VARCHAR(512) NULL,
      request_headers JSON NULL,
      browser_meta JSON NULL,
      metadata JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_created (created_at),
      INDEX idx_audit_action (action),
      INDEX idx_audit_email (email),
      INDEX idx_audit_ip (ip_address)
    )
  `);

  const [tables] = await admin.query("SHOW TABLES");
  console.log("\nTables:");
  console.table(tables);

  const [counts] = await admin.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM orders) AS orders,
      (SELECT COUNT(*) FROM audit_logs) AS audit_logs
  `);
  console.log("\nRow counts (empty until app seeds products):");
  console.table(counts);

  await admin.end();

  const adminEmail = process.env.ADMIN_EMAIL?.trim() || "(set ADMIN_EMAIL in .env)";
  console.log(`
✅ Fresh database ready for deployment/local use.

Admin dashboard (NOT Cognito, NOT MySQL users table):
  URL:      http://localhost:3000/admin/login
  Email:    ${adminEmail}
  Password: (ADMIN_PASSWORD in .env)

Customer store login (Cognito):
  URL:      http://localhost:3000/login
  Use:      demo@example.com (or Google) — not admin@

Next: start the app once so products auto-seed into \`products\`.
`);
}

main().catch((err) => {
  console.error("\nDB reset failed:", err.message ?? err);
  console.error(
    "\nTip: ensure local Homebrew MySQL is running on port 3306 with admin/admin.\n",
  );
  process.exit(1);
});
