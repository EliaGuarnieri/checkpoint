import { Schema } from "effect";

import { CatalogGameId } from "~/modules/catalog/model";
import {
  LibraryEntryId,
  LibraryEntryUpdate,
  TrackingStatus,
} from "~/modules/library/model";

export const CatalogSearchInput = Schema.Struct({
  query: Schema.String.pipe(Schema.trimmed(), Schema.minLength(2)),
});

export const AddCatalogGameInput = Schema.Struct({
  id: CatalogGameId,
});
export const LibraryEntryUpdateInput = LibraryEntryUpdate;
export const LibraryEntryIdInput = LibraryEntryId;

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
