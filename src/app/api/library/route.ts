import { Effect, Schema } from "effect";

import {
  LibraryFiltersInput,
  AddCatalogGameInput,
} from "~/infrastructure/api-schema";
import { getAppRuntimes } from "~/infrastructure/runtime";
import { runHttp } from "~/infrastructure/http";
import { jsonBody } from "~/infrastructure/request";
import { addCatalogGame } from "~/modules/library/programs";
import { LibraryRepository } from "~/modules/library/service";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const program = Effect.gen(function* () {
    const filters = yield* Schema.decodeUnknown(LibraryFiltersInput)({
      query: params.get("query") || undefined,
      status: params.get("status") || undefined,
      genre: params.get("genre") || undefined,
      developer: params.get("developer") || undefined,
      publisher: params.get("publisher") || undefined,
      minimumRating: params.get("minimumRating") || undefined,
      sort: params.get("sort") || undefined,
    });
    const library = yield* LibraryRepository;
    return yield* library.list(filters);
  });
  return runHttp(program, getAppRuntimes().library, request);
}

export async function POST(request: Request) {
  const program = Effect.gen(function* () {
    const { id } = yield* Schema.decodeUnknown(AddCatalogGameInput)(
      yield* jsonBody(request),
    );
    const entryId = yield* addCatalogGame(id);
    return { added: true, id: entryId };
  });
  return runHttp(program, getAppRuntimes().app, request);
}
