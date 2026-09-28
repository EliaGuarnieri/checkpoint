import { Context, Data, Effect } from "effect";

import type { CatalogGame } from "~/modules/catalog/model";

type CatalogOperation = "searchByTitle" | "request" | "decode";

export class CatalogUnavailable extends Data.TaggedError("CatalogUnavailable")<{
  readonly operation: CatalogOperation;
  readonly cause?: unknown;
}> {}

export interface GameCatalogService {
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
