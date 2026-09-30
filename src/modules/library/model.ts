import { Schema } from "effect";

export const TrackingStatus = Schema.Literal(
  "backlog",
  "playing",
  "completed",
  "abandoned",
);
export type TrackingStatus = typeof TrackingStatus.Type;

export const LibraryEntryId = Schema.UUID;
export const Rating = Schema.Int.pipe(Schema.between(1, 10));
export const Note = Schema.String.pipe(Schema.maxLength(10_000));

export const LibraryEntryUpdate = Schema.partial(
  Schema.Struct({
    status: TrackingStatus,
    rating: Schema.NullOr(Rating),
    note: Schema.NullOr(Note),
  }),
);
export type LibraryEntryUpdate = Partial<typeof LibraryEntryUpdate.Type>;

export const LibraryGameSchema = Schema.Struct({
  id: LibraryEntryId,
  rawgId: Schema.NullOr(Schema.Int.pipe(Schema.positive())),
  title: Schema.String,
  slug: Schema.String,
  coverUrl: Schema.NullOr(Schema.String),
  releaseDate: Schema.NullOr(Schema.String),
  status: TrackingStatus,
  rating: Schema.NullOr(Rating),
  note: Schema.NullOr(Note),
  genres: Schema.Array(Schema.String),
  developers: Schema.Array(Schema.String),
  publishers: Schema.Array(Schema.String),
  updatedAt: Schema.String,
});
export type LibraryGame = typeof LibraryGameSchema.Type;

export interface LibraryFilters {
  readonly query?: string;
  readonly status?: TrackingStatus;
  readonly genre?: string;
  readonly developer?: string;
  readonly publisher?: string;
  readonly minimumRating?: number;
  readonly sort?: "updated" | "title" | "rating" | "releaseDate";
}
