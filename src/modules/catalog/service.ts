import { Context, Data, Effect, Option } from "effect";

import type { CatalogGame } from "~/modules/catalog/model";

type CatalogOperation =
  | "findBySteamAppId"
  | "searchByTitle"
  | "request"
  | "decode";

export class CatalogUnavailable extends Data.TaggedError("CatalogUnavailable")<{
  readonly operation: CatalogOperation;
  readonly cause?: unknown;
}> {}

export interface GameCatalogService {
  /**
   * Finds a game in the catalog by its Steam App ID.
   */
  readonly findBySteamAppId: (
    steamAppId: string,
    title: string,
  ) => Effect.Effect<Option.Option<CatalogGame>, CatalogUnavailable>;
  /**
   * Searches for games in the catalog by title.
   */
  readonly searchByTitle: (
    title: string,
  ) => Effect.Effect<ReadonlyArray<CatalogGame>, CatalogUnavailable>;
}

export class GameCatalog extends Context.Tag("checkpoint/GameCatalog")<
  GameCatalog,
  GameCatalogService
>() {}
