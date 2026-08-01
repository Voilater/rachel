/**
 * Initialize MySQL schema.
 * Loads DATABASE_* from .env (npm run db:setup uses --env-file=.env).
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

async function main() {
  console.log(`Connecting to MySQL as ${config.user}@${config.host}:${config.port}…`);

  const dbName = config.database;
  const bootstrap = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });

  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await bootstrap.end();

  const pool = mysql.createPool({ ...config, connectionLimit: 2 });
  console.log("Creating tables in", dbName, "…");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
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

  console.log("Database ready:", dbName);
  console.log("Start the app — products auto-seed on first request if the catalog is empty.");
  await pool.end();
}

main().catch((err) => {
  if (err?.code === "ER_ACCESS_DENIED_ERROR") {
    console.error(
      "\nMySQL access denied. Check DATABASE_USER and DATABASE_PASSWORD in .env match your MySQL server.\n",
    );
  }
  console.error(err.message ?? err);
  process.exit(1);
});
