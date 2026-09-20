import { Schema } from "effect";

export const CatalogGameSchema = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  slug: Schema.String,
  coverUrl: Schema.NullOr(Schema.String),
  releaseDate: Schema.NullOr(Schema.String),
  genres: Schema.Array(Schema.String),
  developers: Schema.Array(Schema.String),
  publishers: Schema.Array(Schema.String),
  steamAppId: Schema.NullOr(Schema.String),
});

export type CatalogGame = typeof CatalogGameSchema.Type;
