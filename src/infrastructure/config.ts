import { Config, ConfigError } from "effect";

const requiredSecret = (name: string) =>
  Config.redacted(
    Config.string(name).pipe(
      Config.validate({
        message: `${name} must not be empty`,
        validation: (value) => value.trim().length > 0,
      }),
    ),
  );

export const DatabaseUrl = requiredSecret("DATABASE_URL");
export const DatabaseMigrationUrl = requiredSecret("DATABASE_MIGRATION_URL");
export const MigrationUrl = DatabaseMigrationUrl.pipe(
  Config.orElseIf({
    if: ConfigError.isMissingDataOnly,
    orElse: () => DatabaseUrl,
  }),
);

export const RawgApiKey = requiredSecret("RAWG_API_KEY");
