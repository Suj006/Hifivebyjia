import "server-only";
import postgres from "postgres";

/**
 * PostgreSQL connection (works with Neon via Vercel Storage, Supabase or any Postgres).
 *
 * Set DATABASE_URL (or POSTGRES_URL, which the Vercel/Neon integration adds
 * automatically). Without it the storefront falls back to the product files in
 * `src/data` and the admin dashboard shows setup instructions.
 */
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const isDatabaseConfigured = () => Boolean(connectionString);

type Sql = postgres.Sql;
const globalForDb = globalThis as unknown as { __h5Sql?: Sql; __h5Schema?: Promise<void> };

function isLocal(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export function sql(): Sql {
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  if (!globalForDb.__h5Sql) {
    globalForDb.__h5Sql = postgres(connectionString, {
      // Transaction poolers (Supabase/Neon) don't support prepared statements.
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
      ssl: isLocal(connectionString) ? false : "require",
      onnotice: () => {},
    });
  }
  return globalForDb.__h5Sql;
}

/** Creates tables (if needed) and seeds them once. Safe to call on every request. */
export function ensureSchema(): Promise<void> {
  if (!globalForDb.__h5Schema) {
    globalForDb.__h5Schema = (async () => {
      const { migrate } = await import("./schema");
      await migrate(sql());
    })().catch((err) => {
      globalForDb.__h5Schema = undefined;
      throw err;
    });
  }
  return globalForDb.__h5Schema;
}

/** Connection + schema, ready to query. */
export async function db(): Promise<Sql> {
  await ensureSchema();
  return sql();
}

export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
