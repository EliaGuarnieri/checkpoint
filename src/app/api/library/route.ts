import { Effect, Schema } from "effect";

import {
  LibraryFiltersInput,
  ManualGameInput,
} from "~/infrastructure/api-schema";
import { makeAppLayer } from "~/infrastructure/app-layer";
import { runHttp } from "~/infrastructure/http";
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
  }).pipe(Effect.provide(makeAppLayer()));
  return runHttp(program);
}

export async function POST(request: Request) {
  const program = Effect.gen(function* () {
    const game = yield* Schema.decodeUnknown(ManualGameInput)(
      yield* Effect.promise(() => request.json()),
    );
    const library = yield* LibraryRepository;
    yield* library.addManualGame(game);
    return { added: true };
  }).pipe(Effect.provide(makeAppLayer()));
  return runHttp(program);
}
