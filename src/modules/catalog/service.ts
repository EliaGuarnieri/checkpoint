import { Context, Data, Effect } from "effect";

import type { CatalogGame } from "~/modules/catalog/model";

export class CatalogUnavailable extends Data.TaggedError("CatalogUnavailable")<{
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export interface GameCatalogService {
  readonly findBySteamAppId: (
    steamAppId: string,
    title: string,
  ) => Effect.Effect<CatalogGame | null, CatalogUnavailable>;
  readonly searchByTitle: (
    title: string,
  ) => Effect.Effect<ReadonlyArray<CatalogGame>, CatalogUnavailable>;
}

export class GameCatalog extends Context.Tag("checkpoint/GameCatalog")<
  GameCatalog,
  GameCatalogService
>() {}
