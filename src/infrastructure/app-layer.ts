import { Effect, Layer, Redacted } from "effect";

import { ConfigurationInvalid, RawgApiKey } from "~/infrastructure/config";
import { DatabaseLive } from "~/infrastructure/database/client";
import { makeGameCatalogLive } from "~/modules/catalog/rawg-live";
import { LibraryRepositoryLive } from "~/modules/library/repository-live";

export const CatalogLive = Layer.unwrapEffect(
  RawgApiKey.pipe(
    Effect.mapError(
      (cause) =>
        new ConfigurationInvalid({
          setting: "RAWG_API_KEY",
          cause: Redacted.make(cause),
        }),
    ),
    Effect.map(makeGameCatalogLive),
  ),
);

export const LibraryLive = LibraryRepositoryLive.pipe(
  Layer.provide(DatabaseLive),
);
export const AppLive = Layer.mergeAll(CatalogLive, LibraryLive);
