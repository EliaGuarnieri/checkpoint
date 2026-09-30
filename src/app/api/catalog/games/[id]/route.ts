import { Effect, Schema } from "effect";

import { getAppRuntimes } from "~/infrastructure/runtime";
import { runHttp } from "~/infrastructure/http";
import { CatalogGameId } from "~/modules/catalog/model";
import { GameCatalog } from "~/modules/catalog/service";

type CatalogGameRouteContext = {
  readonly params: Promise<{ readonly id: string }>;
};

export async function GET(request: Request, context: CatalogGameRouteContext) {
  const { id } = await context.params;
  const program = Effect.gen(function* () {
    const catalogId = yield* Schema.decodeUnknown(CatalogGameId)(id);
    const catalog = yield* GameCatalog;
    return yield* catalog.findById(catalogId);
  });
  return runHttp(program, getAppRuntimes().catalog, request);
}
