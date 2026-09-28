import { Schema } from "effect";

const ApiKey = Schema.String.pipe(Schema.minLength(1));

const AppConfigSchema = Schema.Union(
  Schema.Struct({
    catalogProvider: Schema.Literal("fake"),
    rawgApiKey: Schema.String,
  }),
  Schema.Struct({
    catalogProvider: Schema.Literal("live"),
    rawgApiKey: ApiKey,
  }),
);

export type AppConfig = typeof AppConfigSchema.Type;

export const loadConfig = () =>
  Schema.decodeUnknownSync(AppConfigSchema)({
    catalogProvider: process.env.CATALOG_PROVIDER ?? "fake",
    rawgApiKey: process.env.RAWG_API_KEY ?? "",
  });
