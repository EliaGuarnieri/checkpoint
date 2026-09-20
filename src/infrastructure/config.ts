import { Schema } from "effect";

const Provider = Schema.Literal("fake", "live");
const ApiKey = Schema.String.pipe(Schema.minLength(1));

const AppConfigSchema = Schema.Union(
  Schema.Struct({
    catalogProvider: Schema.Literal("fake"),
    steamProvider: Provider,
    rawgApiKey: Schema.String,
    steamApiKey: Schema.String,
  }),
  Schema.Struct({
    catalogProvider: Schema.Literal("live"),
    steamProvider: Schema.Literal("fake"),
    rawgApiKey: ApiKey,
    steamApiKey: Schema.String,
  }),
  Schema.Struct({
    catalogProvider: Schema.Literal("fake"),
    steamProvider: Schema.Literal("live"),
    rawgApiKey: Schema.String,
    steamApiKey: ApiKey,
  }),
  Schema.Struct({
    catalogProvider: Schema.Literal("live"),
    steamProvider: Schema.Literal("live"),
    rawgApiKey: ApiKey,
    steamApiKey: ApiKey,
  }),
);

export type AppConfig = typeof AppConfigSchema.Type;

export const loadConfig = () =>
  Schema.decodeUnknownSync(AppConfigSchema)({
    catalogProvider: process.env.CATALOG_PROVIDER ?? "fake",
    steamProvider: process.env.STEAM_PROVIDER ?? "fake",
    rawgApiKey: process.env.RAWG_API_KEY ?? "",
    steamApiKey: process.env.STEAM_API_KEY ?? "",
  });
