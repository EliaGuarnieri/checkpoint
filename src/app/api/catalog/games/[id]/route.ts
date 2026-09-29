import { Effect, Schema } from "effect";

import { makeAppLayer } from "~/infrastructure/app-layer";
import { runHttp } from "~/infrastructure/http";
import { GameCatalog } from "~/modules/catalog/service";
import { LibraryRepository } from "~/modules/library/service";

type CatalogGameRouteContext = {
  readonly params: Promise<{ readonly id: string }>;
};

export async function GET(_request: Request, context: CatalogGameRouteContext) {
  const { id } = await context.params;
  const program = Effect.gen(function* () {
    const catalogId = yield* Schema.decodeUnknown(
      Schema.String.pipe(Schema.pattern(/^\d+$/)),
    )(id);
    const catalog = yield* GameCatalog;
    const game = yield* catalog.findById(catalogId);
    const library = yield* LibraryRepository;
    yield* library.refreshCatalogGames([game]);
    return game;
  }).pipe(Effect.provide(makeAppLayer()));
  return runHttp(program);
}
