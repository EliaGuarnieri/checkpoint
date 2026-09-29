import { Schema } from "effect";

import { LibraryEntryUpdate, TrackingStatus } from "~/modules/library/model";

export const CatalogSearchInput = Schema.Struct({
  query: Schema.String.pipe(Schema.trimmed(), Schema.minLength(2)),
});

export const AddCatalogGameInput = Schema.Struct({
  id: Schema.String.pipe(Schema.pattern(/^\d+$/)),
});
export const LibraryEntryUpdateInput = LibraryEntryUpdate;
export const LibraryEntryIdInput = Schema.UUID;

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
