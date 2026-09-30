import { Effect, Layer } from "effect";

import { LibraryRepository } from "~/modules/library/service";

export const LibraryRepositoryFake = Layer.succeed(LibraryRepository, {
  list: () => Effect.succeed([]),
  findById: (gameId) => Effect.dieMessage(`Unexpected findById: ${gameId}`),
  addManualGame: () => Effect.succeed("library-entry-3498"),
  refreshCatalogGame: () => Effect.void,
  update: () => Effect.void,
  remove: () => Effect.void,
});
