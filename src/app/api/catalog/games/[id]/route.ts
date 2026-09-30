import { Effect, Schema } from "effect";

import { makeAppLayer } from "~/infrastructure/app-layer";
import { runHttp } from "~/infrastructure/http";
import { GameCatalog } from "~/modules/catalog/service";

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
    return yield* catalog.findById(catalogId);
  }).pipe(Effect.provide(makeAppLayer()));
  return runHttp(program);
}
