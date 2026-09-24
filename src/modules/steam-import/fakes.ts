import { Effect, Layer } from "effect";

import { GameCatalogFake } from "~/modules/catalog/fakes";
import { LibraryRepositoryFake } from "~/modules/library/fakes";
import { SteamLibrary } from "~/modules/steam-import/steam-library";

export const SteamLibraryFake = Layer.succeed(SteamLibrary, {
  getOwnedGames: () =>
    Effect.succeed([
      { steamAppId: "1145360", title: "Hades" },
      { steamAppId: "504230", title: "Celeste" },
      { steamAppId: "588650", title: "Dead Cells" },
      { steamAppId: "999001", title: "Mystery Quest" },
      { steamAppId: "999002", title: "Catalog Error" },
    ]),
});

export const SteamImportTestLayer = Layer.mergeAll(
  GameCatalogFake,
  LibraryRepositoryFake,
  SteamLibraryFake,
);
