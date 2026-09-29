import { Effect, Schema } from "effect";

import { LibraryEntryIdInput } from "~/infrastructure/api-schema";
import { makeAppLayer } from "~/infrastructure/app-layer";
import { runHttp } from "~/infrastructure/http";
import { GameCatalog } from "~/modules/catalog/service";
import {
  LibraryCatalogIdMissing,
  LibraryRepository,
} from "~/modules/library/service";

type RefreshRouteContext = {
  readonly params: Promise<{ readonly id: string }>;
};

export async function POST(_request: Request, context: RefreshRouteContext) {
  const { id: inputId } = await context.params;
  const program = Effect.gen(function* () {
    const id = yield* Schema.decodeUnknown(LibraryEntryIdInput)(inputId);
    const library = yield* LibraryRepository;
    const entry = yield* library.findById(id);
    if (entry.rawgId === null)
      return yield* Effect.fail(new LibraryCatalogIdMissing({ gameId: id }));

    const catalog = yield* GameCatalog;
    const game = yield* catalog.findById(String(entry.rawgId));
    yield* library.refreshCatalogGame(id, game);
    return yield* library.findById(id);
  }).pipe(Effect.provide(makeAppLayer()));
  return runHttp(program);
}
