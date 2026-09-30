import {
  Clock,
  Data,
  Duration,
  Effect,
  Layer,
  Redacted,
  Schedule,
  Schema,
} from "effect";

import type { CatalogGame, CatalogGamePreview } from "~/modules/catalog/model";
import {
  CatalogHttpError,
  CatalogResponseInvalid,
  CatalogTimeout,
  CatalogUnavailable,
  GameCatalog,
  type CatalogError,
} from "~/modules/catalog/service";

const RawgNamedItem = Schema.Struct({ name: Schema.String });
const RawgGame = Schema.Struct({
  id: Schema.Int.pipe(Schema.positive()),
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
const isTransient = (error: CatalogError) =>
  error._tag === "CatalogUnavailable" ||
  error._tag === "CatalogTimeout" ||
  (error._tag === "CatalogHttpError" &&
    (error.status === 408 || error.status === 429 || error.status >= 500));

const retryPolicy = Schedule.recurWhile<CatalogError>(isTransient).pipe(
  Schedule.intersect(Schedule.recurs(2)),
  Schedule.intersect(Schedule.exponential("100 millis")),
  Schedule.modifyDelay(([[error]], delay) =>
    error._tag === "CatalogHttpError" && error.retryAfterMillis !== undefined
      ? Math.max(Duration.toMillis(delay), error.retryAfterMillis)
      : delay,
  ),
);

const retryAfterMillis = (header: string | null, now: number) => {
  if (header === null) return undefined;
  const seconds = /^\d+$/.test(header.trim()) ? Number(header) : NaN;
  const millis = Number.isFinite(seconds)
    ? seconds * 1_000
    : Date.parse(header) - now;
  return Number.isFinite(millis) ? Math.max(0, millis) : undefined;
};

class RawgBodyFailure extends Data.TaggedError("RawgBodyFailure")<{
  readonly cause: unknown;
}> {}

const isBodyTransportFailure = (cause: unknown) => {
  let current = cause;
  const visited = new Set<unknown>();
  while (
    typeof current === "object" &&
    current !== null &&
    !visited.has(current)
  ) {
    visited.add(current);
    if (
      current instanceof Error &&
      (current.name === "AbortError" || current.message === "terminated")
    )
      return true;
    if (
      "code" in current &&
      typeof current.code === "string" &&
      /^(ECONN|EPIPE|ETIMEDOUT|UND_ERR_|ERR_STREAM_PREMATURE_CLOSE)/.test(
        current.code,
      )
    )
      return true;
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
};

const responseBody = (response: Response) =>
  Effect.tryPromise({
    try: (): Promise<unknown> => response.json(),
    catch: (cause) => new RawgBodyFailure({ cause }),
  }).pipe(
    Effect.catchAll(
      (
        error,
      ): Effect.Effect<never, CatalogResponseInvalid | CatalogUnavailable> => {
        const cause = error.cause;
        if (cause instanceof SyntaxError)
          return Effect.fail(
            new CatalogResponseInvalid({ cause: Redacted.make(cause) }),
          );
        if (isBodyTransportFailure(cause))
          return Effect.fail(
            new CatalogUnavailable({
              operation: "request",
              cause: Redacted.make(cause),
            }),
          );
        return Effect.die(cause);
      },
    ),
  );

const requestJson = <A, I>(url: string, schema: Schema.Schema<A, I>) => {
  const request = Effect.acquireUseRelease(
    Effect.sync(() => new AbortController()),
    (controller) =>
      Effect.gen(function* () {
        const response = yield* Effect.tryPromise({
          try: (signal) =>
            fetch(url, {
              headers: { Accept: "application/json" },
              signal: AbortSignal.any([signal, controller.signal]),
            }),
          catch: (cause) =>
            new CatalogUnavailable({
              operation: "request",
              cause: Redacted.make(cause),
            }),
        });
        if (!response.ok) {
          const now = yield* Clock.currentTimeMillis;
          // Release an unused response body before another attempt.
          yield* Effect.tryPromise(
            () => response.body?.cancel() ?? Promise.resolve(),
          ).pipe(Effect.ignore);
          return yield* Effect.fail(
            new CatalogHttpError({
              status: response.status,
              retryAfterMillis: retryAfterMillis(
                response.headers.get("Retry-After"),
                now,
              ),
            }),
          );
        }
        const body = yield* responseBody(response);
        return yield* Schema.decodeUnknown(schema)(body).pipe(
          Effect.mapError(
            (cause) =>
              new CatalogResponseInvalid({ cause: Redacted.make(cause) }),
          ),
        );
      }),
    (controller) => Effect.sync(() => controller.abort()),
  ).pipe(
    Effect.timeoutFail({
      duration: "3 seconds",
      onTimeout: () => new CatalogTimeout(),
    }),
  );
  return request.pipe(
    Effect.retry(retryPolicy),
    Effect.timeoutFail({
      duration: "10 seconds",
      onTimeout: () => new CatalogTimeout(),
    }),
    Effect.withSpan("catalog.rawg.request"),
  );
};

const toCatalogGamePreview = (
  game: typeof RawgGame.Type,
): CatalogGamePreview => ({
  id: String(game.id),
  title: game.name,
  slug: game.slug,
  coverUrl: game.background_image,
  releaseDate: game.released,
  genres: game.genres.map(({ name }) => name),
});

const toCatalogGame = (game: typeof RawgDetail.Type): CatalogGame => ({
  ...toCatalogGamePreview(game),
  developers: game.developers.map(({ name }) => name),
  publishers: game.publishers.map(({ name }) => name),
});

export const makeGameCatalogLive = (apiKey: Redacted.Redacted<string>) =>
  Layer.succeed(GameCatalog, {
    findById: (id) =>
      requestJson(
        `https://api.rawg.io/api/games/${encodeURIComponent(id)}?key=${encodeURIComponent(Redacted.value(apiKey))}`,
        RawgDetail,
      ).pipe(Effect.map(toCatalogGame), Effect.withSpan("catalog.findById")),
    searchByTitle: (title) =>
      requestJson(
        `https://api.rawg.io/api/games?key=${encodeURIComponent(Redacted.value(apiKey))}&search=${encodeURIComponent(title)}&page_size=6`,
        RawgSearchResponse,
      ).pipe(
        Effect.map(({ results }) => results.map(toCatalogGamePreview)),
        Effect.withSpan("catalog.searchByTitle"),
      ),
  });
