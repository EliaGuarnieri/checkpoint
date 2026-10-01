import { execFile } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { promisify } from "node:util";

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

const execFileAsync = promisify(execFile);

const success = (message: string) => {
  const tick =
    process.stdout.isTTY && process.env.NO_COLOR === undefined
      ? "\x1b[32m✓\x1b[0m"
      : "✓";
  console.log(`  ${tick} ${message}`);
};

const startSpinner = (message: string) => {
  if (!process.stdout.isTTY) {
    console.log(`  ${message}`);
    return undefined;
  }
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let frame = 0;
  const render = () => {
    process.stdout.write(`\r\x1b[2K  ${frames[frame]} ${message}`);
    frame = (frame + 1) % frames.length;
  };
  render();
  return setInterval(render, 80);
};

const withStep = <A, E, R>(
  message: string,
  operation: Effect.Effect<A, E, R>,
  completed: (value: A) => string,
) =>
  Effect.acquireUseRelease(
    Effect.sync(() => startSpinner(message)),
    () => operation,
    (timer) =>
      Effect.sync(() => {
        if (timer !== undefined) {
          clearInterval(timer);
          process.stdout.write("\r\x1b[2K");
        }
      }),
  ).pipe(Effect.tap((value) => Effect.sync(() => success(completed(value)))));

const command = (args: ReadonlyArray<string>, message: string) =>
  Effect.tryPromise({
    try: async (signal) => {
      try {
        await execFileAsync("docker", args, {
          encoding: "utf8",
          timeout: 120_000,
          signal,
        });
      } catch (cause) {
        const stderr =
          cause instanceof Error && "stderr" in cause
            ? String(cause.stderr)
            : "";
        const portOccupied =
          /address already in use|port is already allocated|ports are not available/i.test(
            stderr,
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

const startPostgres = withStep(
  "Starting local PostgreSQL on port 5433...",
  Effect.gen(function* () {
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
  }),
  () => "Local PostgreSQL is ready on port 5433.",
);

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

const checkLibrary = withStep(
  "Checking database connection...",
  Effect.gen(function* () {
    const repository = yield* LibraryRepository;
    return yield* repository.list();
  }),
  (entries) => `Database connected: ${entries.length} library entries.`,
);

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
    if (action === "setup") console.log("\n🎮 Checkpoint · setup\n");
    yield* Effect.try({
      try: () => {
        if (action === "setup" && !existsSync(".env")) {
          copyFileSync(".env.example", ".env", 1);
          success("Created .env with local defaults.");
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
      yield* withStep(
        "Applying database migrations...",
        applyMigrations(migrationSecret),
        () => "Database migrations applied.",
      );
    }
    if (action === "setup" && target === "local") {
      yield* withStep("Preparing demo library...", seedDemoLibrary, (seeded) =>
        seeded
          ? "Demo library created."
          : "Existing library preserved; seed skipped.",
      );
    }
    if (action !== "migrate") yield* checkLibrary;
    if (action === "setup")
      console.log("\n🚀 Checkpoint is ready!\n\n  → Run: pnpm dev\n");
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
        `\n❌ ${message._tag === "Some" ? message.value.message : "Database command failed."}\n`,
      );
      process.exitCode = 1;
    }
  });
};
