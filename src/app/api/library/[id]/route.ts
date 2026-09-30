import { Effect, Schema } from "effect";

import {
  LibraryEntryIdInput,
  LibraryEntryUpdateInput,
} from "~/infrastructure/api-schema";
import { getAppRuntimes } from "~/infrastructure/runtime";
import { runHttp } from "~/infrastructure/http";
import { jsonBody } from "~/infrastructure/request";
import { LibraryRepository } from "~/modules/library/service";

type LibraryRouteContext = {
  readonly params: Promise<{ readonly id: string }>;
};

export async function GET(request: Request, context: LibraryRouteContext) {
  const { id: inputId } = await context.params;
  return runHttp(
    Effect.gen(function* () {
      const id = yield* Schema.decodeUnknown(LibraryEntryIdInput)(inputId);
      const library = yield* LibraryRepository;
      return yield* library.findById(id);
    }),
    getAppRuntimes().library,
    request,
  );
}

export async function PATCH(request: Request, context: LibraryRouteContext) {
  const { id: inputId } = await context.params;
  const program = Effect.gen(function* () {
    const id = yield* Schema.decodeUnknown(LibraryEntryIdInput)(inputId);
    const update = yield* Schema.decodeUnknown(LibraryEntryUpdateInput)(
      yield* jsonBody(request),
    );
    const library = yield* LibraryRepository;
    yield* library.update(id, update);
    return { updated: true };
  });
  return runHttp(program, getAppRuntimes().library, request);
}

export async function DELETE(request: Request, context: LibraryRouteContext) {
  const { id: inputId } = await context.params;
  return runHttp(
    Effect.gen(function* () {
      const id = yield* Schema.decodeUnknown(LibraryEntryIdInput)(inputId);
      const library = yield* LibraryRepository;
      yield* library.remove(id);
      return { removed: true };
    }),
    getAppRuntimes().library,
    request,
  );
}
