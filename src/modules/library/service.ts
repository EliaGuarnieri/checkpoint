import { Context, Data, Effect, Redacted } from "effect";

import type { CatalogGame } from "~/modules/catalog/model";
import type {
  LibraryEntryUpdate,
  LibraryFilters,
  LibraryGame,
} from "~/modules/library/model";

export type LibraryOperation =
  | "addManualGame"
  | "refreshCatalogGame"
  | "listLibrary"
  | "findLibraryEntry"
  | "updateLibraryEntry"
  | "removeLibraryEntry";

export class DatabaseUnavailable extends Data.TaggedError(
  "DatabaseUnavailable",
)<{
  readonly operation: LibraryOperation;
  readonly cause?: Redacted.Redacted<unknown>;
  readonly code?: string;
}> {}

export class DatabaseQueryFailed extends Data.TaggedError(
  "DatabaseQueryFailed",
)<{
  readonly operation: LibraryOperation;
  readonly code: string;
  readonly cause: Redacted.Redacted<unknown>;
}> {}

export type LibraryPersistenceError = DatabaseUnavailable | DatabaseQueryFailed;

export class LibraryEntryNotFound extends Data.TaggedError(
  "LibraryEntryNotFound",
)<{
  readonly gameId: string;
}> {}

export class LibraryCatalogIdMissing extends Data.TaggedError(
  "LibraryCatalogIdMissing",
)<{
  readonly gameId: string;
}> {}

export interface LibraryRepositoryService {
  /**
   * Lists all the games in the library.
   */
  readonly list: (
    filters?: LibraryFilters,
  ) => Effect.Effect<ReadonlyArray<LibraryGame>, LibraryPersistenceError>;
  /**
   * Finds a game in the library by its ID.
   */
  readonly findById: (
    gameId: string,
  ) => Effect.Effect<
    LibraryGame,
    LibraryPersistenceError | LibraryEntryNotFound
  >;
  /**
   * Adds a catalog game to the personal library without changing an existing entry.
   */
  readonly addManualGame: (
    game: CatalogGame,
  ) => Effect.Effect<string, LibraryPersistenceError>;
  /** Refresh a stored game snapshot without changing its personal entry. */
  readonly refreshCatalogGame: (
    gameId: string,
    game: CatalogGame,
  ) => Effect.Effect<void, LibraryPersistenceError | LibraryEntryNotFound>;
  /**
   * Updates an existing game in the library with the provided update data.
   */
  readonly update: (
    gameId: string,
    update: LibraryEntryUpdate,
  ) => Effect.Effect<void, LibraryPersistenceError | LibraryEntryNotFound>;
  /**
   * Removes a game from the library by its ID. This operation will delete the specified game from the library if it exists.
   */
  readonly remove: (
    gameId: string,
  ) => Effect.Effect<void, LibraryPersistenceError | LibraryEntryNotFound>;
}

export class LibraryRepository extends Context.Tag(
  "checkpoint/LibraryRepository",
)<LibraryRepository, LibraryRepositoryService>() {}
