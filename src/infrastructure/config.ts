import { Schema } from "effect";

const Provider = Schema.Literal("fake", "live");

const AppConfigSchema = Schema.Struct({
  catalogProvider: Provider,
  steamProvider: Provider,
  rawgApiKey: Schema.String,
  steamApiKey: Schema.String,
});

export type AppConfig = typeof AppConfigSchema.Type;

export const loadConfig = () =>
  Schema.decodeUnknownSync(AppConfigSchema)({
    catalogProvider: process.env.CATALOG_PROVIDER ?? "fake",
    steamProvider: process.env.STEAM_PROVIDER ?? "fake",
    rawgApiKey: process.env.RAWG_API_KEY ?? "",
    steamApiKey: process.env.STEAM_API_KEY ?? "",
  });
