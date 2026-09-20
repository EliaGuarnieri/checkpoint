import { Layer } from "effect";

import { loadConfig } from "~/infrastructure/config";
import {
  GameCatalogFake,
  SteamLibraryFake,
} from "~/modules/steam-import/fakes";
import { makeGameCatalogLive } from "~/modules/catalog/rawg-live";
import { LibraryRepositoryLive } from "~/modules/library/repository-live";
import { LibraryRepositoryMemory } from "~/modules/library/repository-memory";
import { makeSteamLibraryLive } from "~/modules/steam-import/steam-live";

export const makeAppLayer = () => {
  const config = loadConfig();
  const catalog =
    config.catalogProvider === "live"
      ? makeGameCatalogLive(config.rawgApiKey)
      : GameCatalogFake;
  const steam =
    config.steamProvider === "live"
      ? makeSteamLibraryLive(config.steamApiKey)
      : SteamLibraryFake;
  const library =
    process.env.DATABASE_URL === "memory"
      ? LibraryRepositoryMemory
      : LibraryRepositoryLive;
  return Layer.mergeAll(catalog, steam, library);
};
