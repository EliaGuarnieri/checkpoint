import { Effect, Schema } from "effect";

import { LibraryEntryIdInput } from "~/infrastructure/api-schema";
import { getAppRuntimes } from "~/infrastructure/runtime";
import { runHttp } from "~/infrastructure/http";
import { refreshLibraryEntry } from "~/modules/library/programs";

type RefreshRouteContext = {
  readonly params: Promise<{ readonly id: string }>;
};

export async function POST(request: Request, context: RefreshRouteContext) {
  const { id: inputId } = await context.params;
  const program = Effect.gen(function* () {
    const id = yield* Schema.decodeUnknown(LibraryEntryIdInput)(inputId);
    return yield* refreshLibraryEntry(id);
  });
  return runHttp(program, getAppRuntimes().app, request);
}
