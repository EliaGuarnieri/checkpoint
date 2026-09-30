import { readFileSync } from "node:fs";
import { join } from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { Context, Effect, Layer, Redacted } from "effect";
import { Pool } from "pg";

import * as schema from "~/infrastructure/database/schema";
import { ConfigurationInvalid, DatabaseUrl } from "~/infrastructure/config";

const poolOptions = (databaseUrl: Redacted.Redacted<string>) => {
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

  return {
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
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    allowExitOnIdle: true,
  };
};

const makeDatabase = (client: Pool) => drizzle({ client, schema });
export type DatabaseClient = ReturnType<typeof makeDatabase>;

export class Database extends Context.Tag("checkpoint/Database")<
  Database,
  DatabaseClient
>() {}

export const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const invalidConfiguration = (cause: unknown) =>
      new ConfigurationInvalid({
        setting: "DATABASE_URL / database TLS configuration",
        cause: Redacted.make(cause),
      });
    const url = yield* DatabaseUrl.pipe(Effect.mapError(invalidConfiguration));
    const options = yield* Effect.try({
      try: () => poolOptions(url),
      catch: invalidConfiguration,
    });
    const pool = yield* Effect.acquireRelease(
      Effect.sync(() => {
        const client = new Pool(options);
        // An idle connection error must not become an unhandled EventEmitter error.
        client.on("error", (error) => {
          console.error(
            "Database idle connection failed",
            Redacted.make(error),
          );
        });
        return client;
      }),
      (client) => Effect.promise(() => client.end()),
    );
    return makeDatabase(pool);
  }),
);
