import { Effect } from "effect";

import { GameCatalog } from "~/modules/catalog/service";
import {
  LibraryCatalogIdMissing,
  LibraryRepository,
} from "~/modules/library/service";

export const addCatalogGame = (catalogGameId: string) =>
  Effect.gen(function* () {
    const catalog = yield* GameCatalog;
    const library = yield* LibraryRepository;
    const game = yield* catalog.findById(catalogGameId);
    return yield* library.addManualGame(game);
  }).pipe(Effect.withSpan("library.addCatalogGame"));

export const refreshLibraryEntry = (entryId: string) =>
  Effect.gen(function* () {
    const library = yield* LibraryRepository;
    const entry = yield* library.findById(entryId);
    if (entry.rawgId === null) {
      return yield* Effect.fail(
        new LibraryCatalogIdMissing({ gameId: entryId }),
      );
    }
    const catalog = yield* GameCatalog;
    const game = yield* catalog.findById(String(entry.rawgId));
    yield* library.refreshCatalogGame(entryId, game);
    return yield* library.findById(entryId);
  }).pipe(Effect.withSpan("library.refreshLibraryEntry"));
