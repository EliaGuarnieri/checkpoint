import { readFileSync } from "node:fs";
import { join } from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { Redacted } from "effect";
import { Pool } from "pg";

import * as schema from "~/infrastructure/database/schema";

const makeDatabase = (databaseUrl: Redacted.Redacted<string>) => {
  const connectionString = Redacted.value(databaseUrl);

  let connectionUrl: URL;
  try {
    connectionUrl = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a PostgreSQL URI");
  }
  if (!["postgres:", "postgresql:"].includes(connectionUrl.protocol)) {
    throw new Error("DATABASE_URL must be a PostgreSQL URI");
  }

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
          ca: readFileSync(
            join(process.cwd(), "certs/supabase-ca.crt"),
            "utf8",
          ),
          rejectUnauthorized: true,
          servername: hostname,
        }
      : false,
  });

  return drizzle({ client, schema });
};

export type Database = ReturnType<typeof makeDatabase>;

let database: { readonly url: string; readonly client: Database } | undefined;

export const getDatabase = (
  databaseUrl: Redacted.Redacted<string>,
): Database => {
  const url = Redacted.value(databaseUrl);
  if (database) {
    if (database.url !== url) {
      throw new Error(
        "DATABASE_URL changed after pool initialization; restart the server",
      );
    }
    return database.client;
  }

  const client = makeDatabase(databaseUrl);
  database = { url, client };
  return client;
};

export const closeDatabase = async () => {
  const active = database;
  database = undefined;
  if (active) await active.client.$client.end();
};
