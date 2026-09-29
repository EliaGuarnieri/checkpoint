import { Effect, Layer, Redacted, Schedule, Schema } from "effect";

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
    Effect.flatMap((body) => {
      const decode = Schema.decodeUnknown(schema);
      return decode(body).pipe(
        Effect.mapError(
          (cause) => new CatalogUnavailable({ operation: "decode", cause }),
        ),
      );
    }),
  );

const toCatalogGame = (game: typeof RawgDetail.Type): CatalogGame => ({
  id: String(game.id),
  title: game.name,
  slug: game.slug,
  coverUrl: game.background_image,
  releaseDate: game.released,
  genres: game.genres.map(({ name }) => name),
  developers: game.developers.map(({ name }) => name),
  publishers: game.publishers.map(({ name }) => name),
});

export const makeGameCatalogLive = (apiKey: Redacted.Redacted<string>) =>
  Layer.succeed(GameCatalog, {
    searchByTitle: (title) =>
      Effect.gen(function* () {
        const search = yield* requestJson(
          `https://api.rawg.io/api/games?key=${encodeURIComponent(Redacted.value(apiKey))}&search=${encodeURIComponent(title)}&page_size=10`,
          RawgSearchResponse,
        );

        return yield* Effect.forEach(
          search.results,
          (result) =>
            requestJson(
              `https://api.rawg.io/api/games/${result.id}?key=${encodeURIComponent(Redacted.value(apiKey))}`,
              RawgDetail,
            ).pipe(Effect.map(toCatalogGame)),
          { concurrency: 4 },
        );
      }),
  });
