import { Effect, Schema } from "effect";

import { SteamImportConfirmInput } from "~/infrastructure/api-schema";
import { makeAppLayer } from "~/infrastructure/app-layer";
import { runHttp } from "~/infrastructure/http";
import { jsonBody } from "~/infrastructure/request";
import { confirmSteamImport } from "~/modules/steam-import";

export async function POST(request: Request) {
  const program = Effect.gen(function* () {
    const { games } = yield* Schema.decodeUnknown(SteamImportConfirmInput)(
      yield* jsonBody(request),
    );
    return yield* confirmSteamImport(games);
  }).pipe(Effect.provide(makeAppLayer()));
  return runHttp(program);
}
