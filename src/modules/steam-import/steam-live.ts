import { Effect, Layer, Schema } from "effect";

import {
  SteamLibrary,
  SteamLibraryUnavailable,
} from "~/modules/steam-import/steam-library";

const SteamResponse = Schema.Struct({
  response: Schema.Struct({
    games: Schema.optional(
      Schema.Array(
        Schema.Struct({
          appid: Schema.Number,
          name: Schema.String,
        }),
      ),
    ),
  }),
});

export const makeSteamLibraryLive = (apiKey: string) =>
  Layer.succeed(SteamLibrary, {
    getOwnedGames: (steamId) =>
      Effect.tryPromise({
        try: async () => {
          const url = new URL(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/",
          );
          url.searchParams.set("key", apiKey);
          url.searchParams.set("steamid", steamId);
          url.searchParams.set("include_appinfo", "true");
          url.searchParams.set("include_played_free_games", "true");
          const response = await fetch(url);
          if (!response.ok)
            throw new Error(`Steam returned ${response.status}`);
          return response.json() as Promise<unknown>;
        },
        catch: (cause) => new SteamLibraryUnavailable({ steamId, cause }),
      }).pipe(
        Effect.flatMap(Schema.decodeUnknown(SteamResponse)),
        Effect.mapError(
          (cause) => new SteamLibraryUnavailable({ steamId, cause }),
        ),
        Effect.map(({ response }) =>
          (response.games ?? []).map(({ appid, name }) => ({
            steamAppId: String(appid),
            title: name,
          })),
        ),
      ),
  });
