import { Layer } from "effect";

import { loadConfig } from "~/infrastructure/config";
import { GameCatalogFake } from "~/modules/catalog/fakes";
import { makeGameCatalogLive } from "~/modules/catalog/rawg-live";
import { LibraryRepositoryLive } from "~/modules/library/repository-live";
import { LibraryRepositoryMemory } from "~/modules/library/repository-memory";

export const makeAppLayer = () => {
  const config = loadConfig();
  const catalog =
    config.catalogProvider === "live"
      ? makeGameCatalogLive(config.rawgApiKey)
      : GameCatalogFake;
  const library =
    process.env.DATABASE_URL === "memory"
      ? LibraryRepositoryMemory
      : LibraryRepositoryLive;

  return Layer.mergeAll(catalog, library);
};
