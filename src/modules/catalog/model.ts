import { Schema } from "effect";

export const CatalogGameId = Schema.String.pipe(Schema.pattern(/^[1-9]\d*$/));

export const CatalogGamePreviewSchema = Schema.Struct({
  id: CatalogGameId,
  title: Schema.String,
  slug: Schema.String,
  coverUrl: Schema.NullOr(Schema.String),
  releaseDate: Schema.NullOr(Schema.String),
  genres: Schema.Array(Schema.String),
});

export type CatalogGamePreview = typeof CatalogGamePreviewSchema.Type;

export const CatalogGameSchema = Schema.Struct({
  ...CatalogGamePreviewSchema.fields,
  developers: Schema.Array(Schema.String),
  publishers: Schema.Array(Schema.String),
});

export type CatalogGame = typeof CatalogGameSchema.Type;
