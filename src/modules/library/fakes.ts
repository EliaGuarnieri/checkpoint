import { Effect, Layer } from "effect";

import { LibraryRepository } from "~/modules/library/service";

export const LibraryRepositoryFake = Layer.succeed(LibraryRepository, {
  list: () => Effect.succeed([]),
  findById: (gameId) => Effect.dieMessage(`Unexpected findById: ${gameId}`),
  addManualGame: () => Effect.succeed("00000000-0000-4000-8000-000000000001"),
  refreshCatalogGame: () => Effect.void,
  update: () => Effect.void,
  remove: () => Effect.void,
});
