import { Schema } from "effect";

import { CatalogGameSchema } from "~/modules/catalog/model";
import { LibraryEntryUpdate, TrackingStatus } from "~/modules/library/model";

export const CatalogSearchInput = Schema.Struct({
  query: Schema.String.pipe(Schema.trimmed(), Schema.minLength(2)),
});

export const SteamImportPreviewInput = Schema.Struct({
  steamId: Schema.String.pipe(Schema.trimmed(), Schema.minLength(1)),
});

export const SteamImportConfirmInput = Schema.Struct({
  games: Schema.Array(
    Schema.Struct({ steamAppId: Schema.String, game: CatalogGameSchema }),
  ).pipe(Schema.maxItems(100)),
});

export const ManualGameInput = CatalogGameSchema;
export const LibraryEntryUpdateInput = LibraryEntryUpdate;

export const LibraryFiltersInput = Schema.Struct({
  query: Schema.optional(Schema.String),
  status: Schema.optional(TrackingStatus),
  genre: Schema.optional(Schema.String),
  developer: Schema.optional(Schema.String),
  publisher: Schema.optional(Schema.String),
  minimumRating: Schema.optional(
    Schema.NumberFromString.pipe(Schema.between(1, 10)),
  ),
  sort: Schema.optional(
    Schema.Literal("updated", "title", "rating", "releaseDate"),
  ),
});
