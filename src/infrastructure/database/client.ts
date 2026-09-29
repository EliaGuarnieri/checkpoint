import { readFileSync } from "node:fs";
import { join } from "node:path";

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

if (isSupabase) {
  for (const parameter of [
    "ssl",
    "sslmode",
    "sslrootcert",
    "sslcert",
    "sslkey",
    "sslnegotiation",
    "uselibpqcompat",
  ]) {
    connectionUrl.searchParams.delete(parameter);
  }
}

const client = new Pool({
  connectionString: isSupabase ? connectionUrl.toString() : connectionString,
  max: isSupabase ? 1 : 10,
  ssl: isSupabase
    ? {
        ca: readFileSync(join(process.cwd(), "certs/supabase-ca.crt"), "utf8"),
        rejectUnauthorized: true,
        servername: hostname,
      }
    : false,
});

export const db = drizzle({ client, schema });
