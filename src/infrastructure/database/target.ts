import { Data, Effect, Schema } from "effect";

export class DatabaseConfigurationError extends Data.TaggedError(
  "DatabaseConfigurationError",
)<{ readonly message: string }> {}

const PostgresUrl = Schema.String.pipe(
  Schema.filter((value) => {
    try {
      return ["postgres:", "postgresql:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }),
);

export const isProjectDatabase = (url: URL) =>
  ["localhost", "127.0.0.1"].includes(url.hostname) &&
  url.port === "5433" &&
  url.pathname === "/checkpoint";

export const isSupabaseDatabase = (url: URL) =>
  url.hostname.endsWith(".supabase.com") ||
  url.hostname.endsWith(".supabase.co");

export const decodePostgresUrl = (
  value: string,
  variableName: "DATABASE_URL" | "DATABASE_MIGRATION_URL" = "DATABASE_URL",
) =>
  Schema.decodeUnknown(PostgresUrl)(value).pipe(
    Effect.mapError(
      () =>
        new DatabaseConfigurationError({
          message: `${variableName} must be a PostgreSQL URI`,
        }),
    ),
    Effect.map((decoded) => new URL(decoded)),
  );

export const databaseTarget = (value: string) =>
  decodePostgresUrl(value).pipe(
    Effect.flatMap((url) => {
      if (isProjectDatabase(url)) return Effect.succeed("local" as const);
      if (isSupabaseDatabase(url)) return Effect.succeed("supabase" as const);
      return Effect.fail(
        new DatabaseConfigurationError({
          message:
            "Use the project database on localhost:5433/checkpoint or a Supabase URL. Other database targets are unsupported.",
        }),
      );
    }),
  );
