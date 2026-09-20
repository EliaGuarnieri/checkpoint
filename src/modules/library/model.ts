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

export interface LibraryGame {
  readonly id: string;
  readonly rawgId: number | null;
  readonly title: string;
  readonly slug: string;
  readonly coverUrl: string | null;
  readonly releaseDate: string | null;
  readonly status: TrackingStatus;
  readonly rating: number | null;
  readonly note: string | null;
  readonly genres: ReadonlyArray<string>;
  readonly developers: ReadonlyArray<string>;
  readonly publishers: ReadonlyArray<string>;
  readonly updatedAt: string;
}

export interface LibraryFilters {
  readonly query?: string;
  readonly status?: TrackingStatus;
  readonly genre?: string;
  readonly developer?: string;
  readonly publisher?: string;
  readonly minimumRating?: number;
  readonly sort?: "updated" | "title" | "rating" | "releaseDate";
}
