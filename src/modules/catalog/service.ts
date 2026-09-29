import { Context, Data, Effect } from "effect";

import type { CatalogGame, CatalogGamePreview } from "~/modules/catalog/model";

type CatalogOperation = "searchByTitle" | "findById" | "request" | "decode";

export class CatalogUnavailable extends Data.TaggedError("CatalogUnavailable")<{
  readonly operation: CatalogOperation;
  readonly cause?: unknown;
}> {}

export interface GameCatalogService {
  /** Searches for game previews by title. */
  readonly searchByTitle: (
    title: string,
  ) => Effect.Effect<ReadonlyArray<CatalogGamePreview>, CatalogUnavailable>;
  /** Loads complete catalog metadata for one game. */
  readonly findById: (
    id: string,
  ) => Effect.Effect<CatalogGame, CatalogUnavailable>;
}

export class GameCatalog extends Context.Tag("checkpoint/GameCatalog")<
  GameCatalog,
  GameCatalogService
>() {}
