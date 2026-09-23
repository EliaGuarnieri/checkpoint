import { Effect, Schema } from "effect";

import { SteamImportPreviewInput } from "~/infrastructure/api-schema";
import { makeAppLayer } from "~/infrastructure/app-layer";
import { runHttp } from "~/infrastructure/http";
import { jsonBody } from "~/infrastructure/request";
import { previewSteamImport } from "~/modules/steam-import";

export async function POST(request: Request) {
  const program = Effect.gen(function* () {
    const { steamId } = yield* Schema.decodeUnknown(SteamImportPreviewInput)(
      yield* jsonBody(request),
    );
    return yield* previewSteamImport(steamId);
  }).pipe(Effect.provide(makeAppLayer()));

  return runHttp(program);
}
