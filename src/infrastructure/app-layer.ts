import { Effect, Layer } from "effect";

import { RawgApiKey } from "~/infrastructure/config";
import { makeGameCatalogLive } from "~/modules/catalog/rawg-live";
import { LibraryRepositoryLive } from "~/modules/library/repository-live";

const ConfiguredCatalog = Layer.unwrapEffect(
  Effect.map(RawgApiKey, makeGameCatalogLive),
);

export const makeAppLayer = () =>
  Layer.mergeAll(ConfiguredCatalog, LibraryRepositoryLive);
