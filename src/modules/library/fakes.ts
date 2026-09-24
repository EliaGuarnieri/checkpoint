import { Effect, Layer } from "effect";

import { LibraryRepository } from "~/modules/library/service";

export const LibraryRepositoryFake = Layer.succeed(LibraryRepository, {
  refreshCatalogGames: () => Effect.void,
  containsCatalogGame: (catalogGameId) =>
    Effect.succeed(catalogGameId === "3498"),
  list: () => Effect.succeed([]),
  findById: (gameId) => Effect.dieMessage(`Unexpected findById: ${gameId}`),
  importGame: () => Effect.void,
  addManualGame: () => Effect.void,
  update: () => Effect.void,
  remove: () => Effect.void,
});
