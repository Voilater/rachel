import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;
let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

function getConfig() {
  return {
    host: process.env.DATABASE_HOST ?? "localhost",
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER ?? "root",
    password: process.env.DATABASE_PASSWORD ?? "",
    database: process.env.DATABASE_NAME ?? "vk_studio",
    waitForConnections: true,
    connectionLimit: 10,
  };
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(getConfig());
  }
  return pool;
}

export async function query<T = mysql.RowDataPacket>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  await ensureSchema();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(sql, params);
  return rows as T[];
}

export async function queryOne<T = mysql.RowDataPacket>(
  sql: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params?: unknown[]) {
  await ensureSchema();
  const [result] = await getPool().execute(
    sql,
    params as (string | number | boolean | Date | null | Buffer)[] | undefined,
  );
  return result;
}

async function ensureSchema() {
  if (schemaReady) return;
  if (!schemaPromise) {
    schemaPromise = initializeSchema().finally(() => {
      schemaPromise = null;
    });
  }
  await schemaPromise;
}

async function initializeSchema() {
  const dbName = process.env.DATABASE_NAME ?? "vk_studio";
  const bootstrapPool = mysql.createPool({
    ...getConfig(),
    database: undefined,
  });

  try {
    await bootstrapPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  } finally {
    await bootstrapPool.end();
  }

  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
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

  await db.query(`
    CREATE TABLE IF NOT EXISTS carts (
      owner_key VARCHAR(128) PRIMARY KEY,
      items_json JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await ensureUserProfileColumns(db);

  await db.query(`
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

  await db.query(`
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

  await db.query(`
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

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
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

  await db.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(64) PRIMARY KEY,
      value_json JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await migrateLegacyCategories(db);
  await ensureOrderPaymentColumns(db);

  schemaReady = true;
}

async function ensureOrderPaymentColumns(db: mysql.Pool) {
  const columns = [
    "razorpay_order_id VARCHAR(64) NULL",
    "razorpay_payment_id VARCHAR(64) NULL",
  ];
  for (const column of columns) {
    try {
      await db.query(`ALTER TABLE orders ADD COLUMN ${column}`);
    } catch {
      // already exists
    }
  }
  try {
    await db.query(
      "CREATE INDEX idx_orders_customer_email ON orders (customer_email)",
    );
  } catch {
    // already exists
  }
}

async function ensureUserProfileColumns(db: mysql.Pool) {
  const columns = [
    "phone VARCHAR(32) NULL",
    "shipping_street VARCHAR(512) NULL",
    "shipping_city VARCHAR(128) NULL",
    "shipping_zip VARCHAR(32) NULL",
  ];

  for (const column of columns) {
    try {
      await db.query(`ALTER TABLE users ADD COLUMN ${column}`);
    } catch {
      // Column already exists
    }
  }
}

async function migrateLegacyCategories(db: mysql.Pool) {
  const { LEGACY_CATEGORY_MAP } = await import("@/lib/site-data");
  for (const [from, to] of Object.entries(LEGACY_CATEGORY_MAP)) {
    await db.execute("UPDATE products SET category = ? WHERE category = ?", [to, from]);
  }
}
