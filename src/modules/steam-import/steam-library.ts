import { Context, Data, Effect } from "effect";

import type { OwnedSteamGame } from "~/modules/steam-import/model";

export class SteamLibraryUnavailable extends Data.TaggedError(
  "SteamLibraryUnavailable",
)<{
  readonly steamId: string;
  readonly cause?: unknown;
}> {}

export interface SteamLibraryService {
  readonly getOwnedGames: (
    steamId: string,
  ) => Effect.Effect<ReadonlyArray<OwnedSteamGame>, SteamLibraryUnavailable>;
}

export class SteamLibrary extends Context.Tag("checkpoint/SteamLibrary")<
  SteamLibrary,
  SteamLibraryService
>() {}
