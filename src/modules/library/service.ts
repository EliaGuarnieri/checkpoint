import { Context, Data, Effect } from "effect";

import type { CatalogGame } from "~/modules/catalog/model";
import type {
  LibraryEntryUpdate,
  LibraryFilters,
  LibraryGame,
} from "~/modules/library/model";

export class DatabaseUnavailable extends Data.TaggedError(
  "DatabaseUnavailable",
)<{
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class LibraryEntryNotFound extends Data.TaggedError(
  "LibraryEntryNotFound",
)<{
  readonly gameId: string;
}> {}

export interface LibraryRepositoryService {
  readonly refreshCatalogGames: (
    games: ReadonlyArray<CatalogGame>,
  ) => Effect.Effect<void, DatabaseUnavailable>;
  readonly containsCatalogGame: (
    catalogGameId: string,
  ) => Effect.Effect<boolean, DatabaseUnavailable>;
  readonly list: (
    filters?: LibraryFilters,
  ) => Effect.Effect<ReadonlyArray<LibraryGame>, DatabaseUnavailable>;
  readonly findById: (
    gameId: string,
  ) => Effect.Effect<LibraryGame, DatabaseUnavailable | LibraryEntryNotFound>;
  readonly importGame: (
    game: CatalogGame,
    steamAppId: string,
  ) => Effect.Effect<void, DatabaseUnavailable>;
  readonly addManualGame: (
    game: CatalogGame,
  ) => Effect.Effect<void, DatabaseUnavailable>;
  readonly update: (
    gameId: string,
    update: LibraryEntryUpdate,
  ) => Effect.Effect<void, DatabaseUnavailable | LibraryEntryNotFound>;
  readonly remove: (
    gameId: string,
  ) => Effect.Effect<void, DatabaseUnavailable | LibraryEntryNotFound>;
}

export class LibraryRepository extends Context.Tag(
  "checkpoint/LibraryRepository",
)<LibraryRepository, LibraryRepositoryService>() {}
