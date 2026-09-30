import { Context, Data, Effect, Redacted } from "effect";

import type { CatalogGame, CatalogGamePreview } from "~/modules/catalog/model";

type CatalogOperation = "searchByTitle" | "findById" | "request" | "decode";

export class CatalogUnavailable extends Data.TaggedError("CatalogUnavailable")<{
  readonly operation: CatalogOperation;
  readonly cause?: Redacted.Redacted<unknown>;
}> {}

export class CatalogHttpError extends Data.TaggedError("CatalogHttpError")<{
  readonly status: number;
  readonly retryAfterMillis?: number;
}> {}

export class CatalogResponseInvalid extends Data.TaggedError(
  "CatalogResponseInvalid",
)<{
  readonly cause: Redacted.Redacted<unknown>;
}> {}

export class CatalogTimeout extends Data.TaggedError("CatalogTimeout")<{}> {}

export type CatalogError =
  | CatalogUnavailable
  | CatalogHttpError
  | CatalogResponseInvalid
  | CatalogTimeout;

export interface GameCatalogService {
  /** Searches for game previews by title. */
  readonly searchByTitle: (
    title: string,
  ) => Effect.Effect<ReadonlyArray<CatalogGamePreview>, CatalogError>;
  /** Loads complete catalog metadata for one game. */
  readonly findById: (id: string) => Effect.Effect<CatalogGame, CatalogError>;
}

export class GameCatalog extends Context.Tag("checkpoint/GameCatalog")<
  GameCatalog,
  GameCatalogService
>() {}
