import { Schema } from "effect";

export const TrackingStatus = Schema.Literal(
  "backlog",
  "playing",
  "completed",
  "abandoned",
);
export type TrackingStatus = typeof TrackingStatus.Type;

export const LibraryEntryUpdate = Schema.Struct({
  status: TrackingStatus,
  rating: Schema.NullOr(Schema.Int.pipe(Schema.between(1, 10))),
  note: Schema.NullOr(Schema.String.pipe(Schema.maxLength(10_000))),
});
export type LibraryEntryUpdate = typeof LibraryEntryUpdate.Type;

export const LibraryGameSchema = Schema.Struct({
  id: Schema.String,
  rawgId: Schema.NullOr(Schema.Number),
  title: Schema.String,
  slug: Schema.String,
  coverUrl: Schema.NullOr(Schema.String),
  releaseDate: Schema.NullOr(Schema.String),
  status: TrackingStatus,
  rating: Schema.NullOr(Schema.Number),
  note: Schema.NullOr(Schema.String),
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
