import { Config, Effect, Layer, Redacted } from "effect";

import { DatabaseUrl, RawgApiKey } from "~/infrastructure/config";
import { databaseTarget } from "~/infrastructure/database/target";
import { GameCatalogDemo } from "~/modules/catalog/demo";
import { makeGameCatalogLive } from "~/modules/catalog/rawg-live";
import { LibraryRepositoryLive } from "~/modules/library/repository-live";

const ConfiguredCatalog = Layer.unwrapEffect(
  Effect.gen(function* () {
    const url = yield* DatabaseUrl;
    const target = yield* databaseTarget(Redacted.value(url));
    if (target === "local") {
      const key = yield* Config.redacted(
        Config.string("RAWG_API_KEY").pipe(Config.withDefault("")),
      );
      if (!Redacted.value(key).trim()) return GameCatalogDemo;
    }
    const key = yield* RawgApiKey;
    return makeGameCatalogLive(key);
  }),
);

export const makeAppLayer = () =>
  Layer.mergeAll(ConfiguredCatalog, LibraryRepositoryLive);
