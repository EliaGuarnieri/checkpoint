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

export interface CatalogGame {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly coverUrl: string | null;
  readonly releaseDate: string | null;
  readonly genres: ReadonlyArray<string>;
  readonly developers: ReadonlyArray<string>;
  readonly publishers: ReadonlyArray<string>;
  readonly steamAppId: string | null;
}
