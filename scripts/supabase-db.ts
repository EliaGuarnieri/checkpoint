import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

import { ConfigProvider, Effect, ManagedRuntime, Redacted } from "effect";

import {
  DatabaseMigrationUrl,
  DatabaseUrl,
} from "../src/infrastructure/config";

const fileVariables = parseEnv(readFileSync(".env", "utf8"));
const fileProvider = ConfigProvider.fromMap(
  new Map(
    Object.entries(fileVariables).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  ),
);
const caPath = resolve("certs/supabase-ca.crt");

const connection = (name: "DATABASE_URL" | "DATABASE_MIGRATION_URL") => {
  const config = name === "DATABASE_URL" ? DatabaseUrl : DatabaseMigrationUrl;
  const value = Redacted.value(
    Effect.runSync(Effect.withConfigProvider(config, fileProvider)),
  );

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a PostgreSQL URI`);
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error(`${name} must be a PostgreSQL URI`);
  }
  const isSupabase =
    url.hostname.endsWith(".supabase.com") ||
    url.hostname.endsWith(".supabase.co");
  if (!isSupabase) throw new Error(`${name} must point to Supabase`);
  const sslMode = url.searchParams.get("sslmode");
  if (sslMode && !["require", "verify-full"].includes(sslMode)) {
    throw new Error(`${name} must require TLS`);
  }
  return url;
};

const projectRef = (url: URL) => {
  if (url.hostname.endsWith(".pooler.supabase.com")) {
    const [, ref] = decodeURIComponent(url.username).split(".");
    if (!ref) throw new Error("Pooler URI is missing the project reference");
    return ref;
  }

  const match = /^db\.([^.]+)\.supabase\.co$/.exec(url.hostname);
  if (!match) throw new Error("URI is missing the Supabase project reference");
  return match[1];
};

const main = async () => {
  const runtimeUrl = connection("DATABASE_URL");
  if (
    !runtimeUrl.hostname.endsWith(".pooler.supabase.com") ||
    runtimeUrl.port !== "6543"
  ) {
    throw new Error(
      "DATABASE_URL must use the transaction pooler on port 6543",
    );
  }
  runtimeUrl.searchParams.set("sslmode", "verify-full");
  process.env.DATABASE_URL = runtimeUrl.toString();

  switch (process.argv[2]) {
    case "migrate": {
      const migrationUrl = connection("DATABASE_MIGRATION_URL");
      if (migrationUrl.port !== "5432") {
        throw new Error(
          "DATABASE_MIGRATION_URL must use the direct or session connection on port 5432",
        );
      }
      if (projectRef(runtimeUrl) !== projectRef(migrationUrl)) {
        throw new Error("Supabase URLs must belong to the same project");
      }
      migrationUrl.searchParams.set("sslmode", "verify-full");
      migrationUrl.searchParams.set("sslrootcert", caPath);

      const result = spawnSync(
        process.execPath,
        ["./node_modules/drizzle-kit/bin.cjs", "migrate"],
        {
          stdio: "inherit",
          env: {
            ...process.env,
            DATABASE_MIGRATION_URL: migrationUrl.toString(),
          },
        },
      );
      if (result.error) throw result.error;
      process.exitCode = result.status ?? 1;
      break;
    }
    case "check": {
      const [
        { closeDatabase },
        { LibraryRepositoryLive },
        { LibraryRepository },
      ] = await Promise.all([
        import("../src/infrastructure/database/client"),
        import("../src/modules/library/repository-live"),
        import("../src/modules/library/service"),
      ]);
      const runtime = ManagedRuntime.make(LibraryRepositoryLive);
      try {
        const program = Effect.gen(function* () {
          const repository = yield* LibraryRepository;
          return yield* repository.list();
        });
        const library = await runtime.runPromise(program);
        console.log(`Supabase connected: ${library.length} library entries.`);
      } finally {
        await runtime.dispose();
        await closeDatabase();
      }
      break;
    }
    default:
      throw new Error("Expected migrate or check");
  }
};

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
