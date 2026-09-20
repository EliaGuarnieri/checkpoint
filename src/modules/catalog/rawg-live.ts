import { Effect, Layer, Schedule, Schema } from "effect";

import type { CatalogGame } from "~/modules/catalog/model";
import { CatalogUnavailable, GameCatalog } from "~/modules/catalog/service";

const RawgNamedItem = Schema.Struct({ name: Schema.String });
const RawgGame = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  slug: Schema.String,
  background_image: Schema.NullOr(Schema.String),
  released: Schema.NullOr(Schema.String),
  genres: Schema.Array(RawgNamedItem),
});
const RawgSearchResponse = Schema.Struct({ results: Schema.Array(RawgGame) });
const RawgDetail = Schema.Struct({
  ...RawgGame.fields,
  developers: Schema.Array(RawgNamedItem),
  publishers: Schema.Array(RawgNamedItem),
});
const RawgStores = Schema.Struct({
  results: Schema.Array(
    Schema.Struct({
      url: Schema.String,
      store_id: Schema.Number,
    }),
  ),
});

const requestJson = <A, I>(url: string, schema: Schema.Schema<A, I>) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`RAWG returned ${response.status}`);
      const body: unknown = await response.json();
      return body;
    },
    catch: (cause) => new CatalogUnavailable({ operation: "request", cause }),
  }).pipe(
    Effect.retry(
      Schedule.exponential("100 millis").pipe(
        Schedule.compose(Schedule.recurs(2)),
      ),
    ),
    Effect.flatMap(Schema.decodeUnknown(schema)),
    Effect.mapError(
      (cause) => new CatalogUnavailable({ operation: "decode", cause }),
    ),
  );

const toCatalogGame = (
  game: typeof RawgDetail.Type,
  steamAppId: string | null,
): CatalogGame => ({
  id: String(game.id),
  title: game.name,
  slug: game.slug,
  coverUrl: game.background_image,
  releaseDate: game.released,
  genres: game.genres.map(({ name }) => name),
  developers: game.developers.map(({ name }) => name),
  publishers: game.publishers.map(({ name }) => name),
  steamAppId,
});

export const makeGameCatalogLive = (apiKey: string) =>
  Layer.succeed(GameCatalog, {
    searchByTitle: (title) =>
      Effect.gen(function* () {
        const search = yield* requestJson(
          `https://api.rawg.io/api/games?key=${encodeURIComponent(apiKey)}&search=${encodeURIComponent(title)}&page_size=10`,
          RawgSearchResponse,
        );
        return yield* Effect.forEach(
          search.results,
          (result) =>
            requestJson(
              `https://api.rawg.io/api/games/${result.id}?key=${encodeURIComponent(apiKey)}`,
              RawgDetail,
            ).pipe(Effect.map((detail) => toCatalogGame(detail, null))),
          { concurrency: 4 },
        );
      }),
    findBySteamAppId: (steamAppId, title) =>
      Effect.gen(function* () {
        const search = yield* requestJson(
          `https://api.rawg.io/api/games?key=${encodeURIComponent(apiKey)}&search=${encodeURIComponent(title)}&search_exact=true&page_size=5`,
          RawgSearchResponse,
        );
        for (const result of search.results) {
          const stores = yield* requestJson(
            `https://api.rawg.io/api/games/${result.id}/stores?key=${encodeURIComponent(apiKey)}`,
            RawgStores,
          );
          const steamStore = stores.results.find(
            ({ url, store_id }) =>
              store_id === 1 &&
              (url.includes(`/app/${steamAppId}`) ||
                url.includes(`app/${steamAppId}/`)),
          );
          if (steamStore) {
            const detail = yield* requestJson(
              `https://api.rawg.io/api/games/${result.id}?key=${encodeURIComponent(apiKey)}`,
              RawgDetail,
            );
            return toCatalogGame(detail, steamAppId);
          }
        }
        return null;
      }),
  });
