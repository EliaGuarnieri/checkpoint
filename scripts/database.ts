import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

import { loadEnvConfig } from "@next/env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Cause, Data, Effect, Exit, Redacted } from "effect";

import {
  DatabaseMigrationUrl,
  DatabaseUrl,
  MigrationUrl,
  RawgApiKey,
} from "../src/infrastructure/config";
import {
  closeDatabase,
  getDatabase,
} from "../src/infrastructure/database/client";
import {
  databaseTarget,
  decodePostgresUrl,
  isSupabaseDatabase,
} from "../src/infrastructure/database/target";
import {
  LibraryRepositoryLive,
  seedDemoLibrary,
} from "../src/modules/library/repository-live";
import { LibraryRepository } from "../src/modules/library/service";

class SetupError extends Data.TaggedError("SetupError")<{
  readonly message: string;
}> {}

const command = (args: ReadonlyArray<string>, message: string) =>
  Effect.try({
    try: () => {
      const result = spawnSync("docker", args, {
        encoding: "utf8",
        timeout: 120_000,
      });
      if (result.error || result.status !== 0) {
        const portOccupied =
          /address already in use|port is already allocated|ports are not available/i.test(
            result.stderr ?? "",
          );
        throw new SetupError({
          message: portOccupied
            ? "Port 5433 is occupied. Stop the conflicting service and run pnpm setup again."
            : message,
        });
      }
    },
    catch: (cause) =>
      cause instanceof SetupError ? cause : new SetupError({ message }),
  });

const startPostgres = Effect.gen(function* () {
  yield* command(
    ["--version"],
    "Docker is not installed. Install Docker with Compose, then run pnpm setup again.",
  );
  yield* command(
    ["info"],
    "Docker is unavailable. Start Docker, then run pnpm setup again.",
  );
  yield* command(
    ["compose", "version"],
    "Docker Compose is unavailable. Install the Compose plugin, then run pnpm setup again.",
  );
  console.log("Starting local PostgreSQL on port 5433...");
  yield* command(
    [
      "compose",
      "-f",
      "compose.yaml",
      "up",
      "--wait",
      "--wait-timeout",
      "45",
      "postgres",
    ],
    "PostgreSQL could not start or become ready. Check Docker and docker compose logs postgres, then retry.",
  );
});

const projectRef = (url: URL) => {
  if (url.hostname.endsWith(".pooler.supabase.com")) {
    const [, ref] = decodeURIComponent(url.username).split(".");
    if (ref) return ref;
  }
  const match = /^db\.([^.]+)\.supabase\.co$/.exec(url.hostname);
  if (match?.[1]) return match[1];
  throw new SetupError({
    message: "Supabase URI is missing the project reference",
  });
};

const requireSupabaseTls = (url: URL) => {
  const sslMode = url.searchParams.get("sslmode");
  if (sslMode && !["require", "verify-full"].includes(sslMode)) {
    throw new SetupError({ message: "Supabase connections must require TLS" });
  }
};

const validateSupabaseRuntime = (runtimeUrl: URL) => {
  if (
    !runtimeUrl.hostname.endsWith(".pooler.supabase.com") ||
    runtimeUrl.port !== "6543"
  ) {
    throw new SetupError({
      message:
        "Supabase DATABASE_URL must use the transaction pooler on port 6543",
    });
  }
  requireSupabaseTls(runtimeUrl);
};

const supabaseConnections = (runtimeUrl: URL) =>
  Effect.gen(function* () {
    const migrationSecret = yield* DatabaseMigrationUrl;
    const migrationUrl = yield* decodePostgresUrl(
      Redacted.value(migrationSecret),
      "DATABASE_MIGRATION_URL",
    );
    return yield* Effect.try({
      try: () => {
        if (!isSupabaseDatabase(migrationUrl) || migrationUrl.port !== "5432") {
          throw new SetupError({
            message:
              "DATABASE_MIGRATION_URL must use the Supabase direct or session connection on port 5432",
          });
        }
        if (projectRef(runtimeUrl) !== projectRef(migrationUrl)) {
          throw new SetupError({
            message: "Supabase URLs must belong to the same project",
          });
        }
        requireSupabaseTls(migrationUrl);
        migrationUrl.searchParams.set("sslmode", "verify-full");
        return Redacted.make(migrationUrl.toString());
      },
      catch: (cause) =>
        cause instanceof SetupError
          ? cause
          : new SetupError({
              message: "Invalid Supabase connection configuration",
            }),
    });
  });

const applyMigrations = (url: Redacted.Redacted<string>) =>
  Effect.tryPromise({
    try: async () => {
      try {
        await migrate(getDatabase(url), { migrationsFolder: "drizzle" });
      } finally {
        await closeDatabase();
      }
    },
    catch: () =>
      new SetupError({
        message:
          "Database migration failed. Verify connection settings and database availability.",
      }),
  });

const checkLibrary = Effect.gen(function* () {
  const repository = yield* LibraryRepository;
  const entries = yield* repository.list();
  console.log(`Database connected: ${entries.length} library entries.`);
});

export const databaseCommand = (
  action: string | undefined,
  supabaseOnly = false,
) =>
  Effect.gen(function* () {
    if (!["setup", "migrate", "check"].includes(action ?? "")) {
      return yield* Effect.fail(
        new SetupError({ message: "Expected setup, migrate or check" }),
      );
    }
    yield* Effect.try({
      try: () => {
        if (action === "setup" && !existsSync(".env")) {
          copyFileSync(".env.example", ".env", 1);
          console.log("Created .env with local defaults.");
        }
        loadEnvConfig(process.cwd(), true);
      },
      catch: () =>
        new SetupError({
          message:
            "Could not prepare the environment. Check .env.example and file permissions.",
        }),
    });
    const runtimeSecret = yield* DatabaseUrl;
    const target = yield* databaseTarget(Redacted.value(runtimeSecret));
    if (supabaseOnly && target !== "supabase") {
      return yield* Effect.fail(
        new SetupError({
          message:
            "This command requires a Supabase database. Use pnpm db:migrate or pnpm db:check for local PostgreSQL.",
        }),
      );
    }
    const runtimeUrl = new URL(Redacted.value(runtimeSecret));
    let migrationSecret = runtimeSecret;
    if (target === "supabase") {
      yield* Effect.try({
        try: () => validateSupabaseRuntime(runtimeUrl),
        catch: (cause) =>
          cause instanceof SetupError
            ? cause
            : new SetupError({
                message: "Invalid Supabase connection configuration",
              }),
      });
      if (action === "setup") yield* RawgApiKey;
      if (action !== "check")
        migrationSecret = yield* supabaseConnections(runtimeUrl);
    } else if (action !== "check") {
      migrationSecret = yield* MigrationUrl;
      const migrationTarget = yield* databaseTarget(
        Redacted.value(migrationSecret),
      );
      if (migrationTarget !== "local") {
        return yield* Effect.fail(
          new SetupError({
            message:
              "Local migrations must use the project database. Clear DATABASE_MIGRATION_URL to use DATABASE_URL.",
          }),
        );
      }
    }
    if (target === "local" && action === "setup") yield* startPostgres;
    if (action === "setup" || action === "migrate") {
      yield* applyMigrations(migrationSecret);
      console.log("Database migrations applied.");
    }
    if (action === "setup" && target === "local") {
      const seeded = yield* seedDemoLibrary;
      console.log(
        seeded
          ? "Demo library created."
          : "Existing library preserved; seed skipped.",
      );
    }
    if (action !== "migrate") yield* checkLibrary;
    if (action === "setup") console.log("Checkpoint is ready. Run: pnpm dev");
  }).pipe(
    // oxlint-disable-next-line effecttsgo/strict-effect-provide -- This CLI boundary supplies all repository dependencies once.
    Effect.provide(LibraryRepositoryLive),
    Effect.catchAll((error) =>
      Effect.fail(
        new SetupError({
          message:
            error instanceof SetupError ||
            error._tag === "DatabaseConfigurationError"
              ? error.message
              : error._tag === "DatabaseUnavailable"
                ? "Database operation failed. Verify connection settings and database availability."
                : "Required configuration is missing or invalid. Check DATABASE_URL, DATABASE_MIGRATION_URL and RAWG_API_KEY.",
        }),
      ),
    ),
    Effect.ensuring(Effect.promise(closeDatabase)),
  );

export const runDatabaseCli = (supabaseOnly = false) => {
  void Effect.runPromiseExit(
    databaseCommand(process.argv[2], supabaseOnly),
  ).then((result) => {
    if (Exit.isFailure(result)) {
      const message = Cause.failureOption(result.cause);
      console.error(
        message._tag === "Some"
          ? message.value.message
          : "Database command failed.",
      );
      process.exitCode = 1;
    }
  });
};
