import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "~/infrastructure/database/schema";

const configuredUrl = process.env.DATABASE_URL;
const connectionString =
  configuredUrl && configuredUrl !== "memory"
    ? configuredUrl
    : "postgres://checkpoint:checkpoint@localhost:5432/checkpoint";

const connectionUrl = new URL(connectionString);
const hostname = connectionUrl.hostname;
const isSupabase =
  hostname.endsWith(".supabase.com") || hostname.endsWith(".supabase.co");
const sslMode = connectionUrl.searchParams.get("sslmode");
if (isSupabase && sslMode && !["require", "verify-full"].includes(sslMode)) {
  throw new Error("Supabase DATABASE_URL must require TLS");
}
const client = new Pool({
  connectionString,
  max: isSupabase ? 1 : 10,
  ssl: isSupabase,
});

export const db = drizzle({ client, schema });
