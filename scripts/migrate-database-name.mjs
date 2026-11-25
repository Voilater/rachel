import mysql from "mysql2/promise";

function option(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length);
}

function quoteIdentifier(value) {
  if (!/^[a-zA-Z0-9_]+$/.test(value ?? "")) {
    throw new Error(
      "Database names may contain only letters, numbers, and underscores.",
    );
  }
  return `\`${value}\``;
}

const sourceName = option("from");
const targetName = option("to");
if (!sourceName || !targetName || sourceName === targetName) {
  throw new Error(
    "Usage: node --env-file=.env scripts/migrate-database-name.mjs --from=old_name --to=new_name",
  );
}

const source = quoteIdentifier(sourceName);
const target = quoteIdentifier(targetName);
const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_ROOT_USER ?? process.env.DATABASE_USER ?? "root",
  password:
    process.env.DATABASE_ROOT_PASSWORD ?? process.env.DATABASE_PASSWORD ?? "",
});

let targetCreated = false;
try {
  const [schemas] = await connection.execute(
    `SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
     FROM information_schema.SCHEMATA
     WHERE SCHEMA_NAME IN (?, ?)`,
    [sourceName, targetName],
  );
  const schemaByName = new Map(
    schemas.map((schema) => [schema.SCHEMA_NAME, schema]),
  );
  const sourceSchema = schemaByName.get(sourceName);
  if (!sourceSchema)
    throw new Error(`Source database "${sourceName}" does not exist.`);
  if (schemaByName.has(targetName)) {
    throw new Error(
      `Target database "${targetName}" already exists; refusing to overwrite it.`,
    );
  }

  const [objects] = await connection.execute(
    `SELECT TABLE_NAME, TABLE_TYPE
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?`,
    [sourceName],
  );
  if (objects.some((object) => object.TABLE_TYPE !== "BASE TABLE")) {
    throw new Error(
      "Database migration supports base tables only; source has a view or other object.",
    );
  }
  const [triggers] = await connection.execute(
    "SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?",
    [sourceName],
  );
  const [routines] = await connection.execute(
    "SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ?",
    [sourceName],
  );
  const [events] = await connection.execute(
    "SELECT EVENT_NAME FROM information_schema.EVENTS WHERE EVENT_SCHEMA = ?",
    [sourceName],
  );
  if (triggers.length || routines.length || events.length) {
    throw new Error(
      "Database migration does not copy triggers, routines, or events.",
    );
  }

  const characterSet = quoteIdentifier(
    sourceSchema.DEFAULT_CHARACTER_SET_NAME,
  ).replaceAll("`", "");
  const collation = quoteIdentifier(
    sourceSchema.DEFAULT_COLLATION_NAME,
  ).replaceAll("`", "");
  await connection.query(
    `CREATE DATABASE ${target} CHARACTER SET ${characterSet} COLLATE ${collation}`,
  );
  targetCreated = true;

  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  const tableNames = objects.map((object) => object.TABLE_NAME);
  for (const tableName of tableNames) {
    const table = quoteIdentifier(tableName);
    await connection.query(
      `CREATE TABLE ${target}.${table} LIKE ${source}.${table}`,
    );
  }
  for (const tableName of tableNames) {
    const table = quoteIdentifier(tableName);
    const [result] = await connection.query(
      `INSERT INTO ${target}.${table} SELECT * FROM ${source}.${table}`,
    );
    console.log(`${tableName}: ${result.affectedRows} rows copied`);
  }
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log(`Database migration completed: ${sourceName} -> ${targetName}`);
} catch (error) {
  if (targetCreated) {
    try {
      await connection.query(`DROP DATABASE ${target}`);
    } catch (cleanupError) {
      console.error(
        "Could not remove the incomplete target database:",
        cleanupError,
      );
    }
  }
  throw error;
} finally {
  await connection.end();
}
