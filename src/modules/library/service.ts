import { Context, Data, Effect } from "effect";

import type { CatalogGame } from "~/modules/catalog/model";
import type {
  LibraryEntryUpdate,
  LibraryFilters,
  LibraryGame,
} from "~/modules/library/model";

export type LibraryOperation =
  | "refreshCatalogGames"
  | "containsCatalogGame"
  | "list"
  | "findById"
  | "importGame"
  | "addManualGame"
  | "update"
  | "remove";

export class DatabaseUnavailable extends Data.TaggedError(
  "DatabaseUnavailable",
)<{
  readonly operation: LibraryOperation;
  readonly cause?: unknown;
}> {}

export class LibraryEntryNotFound extends Data.TaggedError(
  "LibraryEntryNotFound",
)<{
  readonly gameId: string;
}> {}

export interface LibraryRepositoryService {
  /**
   * Update local snapshots of catalog games in the library.
   */
  readonly refreshCatalogGames: (
    games: ReadonlyArray<CatalogGame>,
  ) => Effect.Effect<void, DatabaseUnavailable>;
  /**
   * Checks if the library contains a catalog game with the specified ID.
   */
  readonly containsCatalogGame: (
    catalogGameId: string,
  ) => Effect.Effect<boolean, DatabaseUnavailable>;
  /**
   * Lists all the games in the library.
   */
  readonly list: (
    filters?: LibraryFilters,
  ) => Effect.Effect<ReadonlyArray<LibraryGame>, DatabaseUnavailable>;
  /**
   * Finds a game in the library by its ID.
   */
  readonly findById: (
    gameId: string,
  ) => Effect.Effect<LibraryGame, DatabaseUnavailable | LibraryEntryNotFound>;
  /**
   * Imports a catalog game into the library.
   * - Creates a new library entry for the game if it doesn't exist.
   * - Saves or updates game metadata in the library.
   * - Records Steam ownership information for the game.
   */
  readonly importGame: (
    game: CatalogGame,
    steamAppId: string,
  ) => Effect.Effect<void, DatabaseUnavailable>;
  /**
   * Adds a manual game to the library. Same as importGame but without a steamAppId. This is used for games that are not in the catalog.
   */
  readonly addManualGame: (
    game: CatalogGame,
  ) => Effect.Effect<void, DatabaseUnavailable>;
  /**
   * Updates an existing game in the library with the provided update data.
   */
  readonly update: (
    gameId: string,
    update: LibraryEntryUpdate,
  ) => Effect.Effect<void, DatabaseUnavailable | LibraryEntryNotFound>;
  /**
   * Removes a game from the library by its ID. This operation will delete the specified game from the library if it exists.
   */
  readonly remove: (
    gameId: string,
  ) => Effect.Effect<void, DatabaseUnavailable | LibraryEntryNotFound>;
}

export class LibraryRepository extends Context.Tag(
  "checkpoint/LibraryRepository",
)<LibraryRepository, LibraryRepositoryService>() {}

Effect.log("LibraryRepository", LibraryRepository);
