import { Effect, Schema } from "effect";

import { LibraryEntryUpdateInput } from "~/infrastructure/api-schema";
import { makeAppLayer } from "~/infrastructure/app-layer";
import { runHttp } from "~/infrastructure/http";
import { LibraryRepository } from "~/modules/library/service";

type LibraryRouteContext = {
  readonly params: Promise<{ readonly id: string }>;
};

export async function GET(_request: Request, context: LibraryRouteContext) {
  const { id } = await context.params;
  return runHttp(
    Effect.gen(function* () {
      const library = yield* LibraryRepository;
      return yield* library.findById(id);
    }).pipe(Effect.provide(makeAppLayer())),
  );
}

export async function PATCH(request: Request, context: LibraryRouteContext) {
  const { id } = await context.params;
  const program = Effect.gen(function* () {
    const update = yield* Schema.decodeUnknown(LibraryEntryUpdateInput)(
      yield* Effect.promise(() => request.json()),
    );
    const library = yield* LibraryRepository;
    yield* library.update(id, update);
    return { updated: true };
  }).pipe(Effect.provide(makeAppLayer()));
  return runHttp(program);
}

export async function DELETE(_request: Request, context: LibraryRouteContext) {
  const { id } = await context.params;
  return runHttp(
    Effect.gen(function* () {
      const library = yield* LibraryRepository;
      yield* library.remove(id);
      return { removed: true };
    }).pipe(Effect.provide(makeAppLayer())),
  );
}
