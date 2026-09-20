import { Effect, Schema } from "effect";

import { CatalogSearchInput } from "~/infrastructure/api-schema";
import { makeAppLayer } from "~/infrastructure/app-layer";
import { runHttp } from "~/infrastructure/http";
import { GameCatalog } from "~/modules/catalog/service";
import { LibraryRepository } from "~/modules/library/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const program = Effect.gen(function* () {
    const { query } = yield* Schema.decodeUnknown(CatalogSearchInput)({
      query: url.searchParams.get("query") ?? "",
    });
    const catalog = yield* GameCatalog;
    const games = yield* catalog.searchByTitle(query);
    const library = yield* LibraryRepository;
    yield* library.refreshCatalogGames(games);
    return games;
  }).pipe(Effect.provide(makeAppLayer()));
  return runHttp(program);
}
