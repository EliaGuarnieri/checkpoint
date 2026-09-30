import { Clock, Effect, Layer, Ref } from "effect";

import type { CatalogGame } from "~/modules/catalog/model";
import type { LibraryGame } from "~/modules/library/model";
import { filterLibraryGames } from "~/modules/library/query";
import {
  LibraryEntryNotFound,
  LibraryRepository,
} from "~/modules/library/service";

const initialEntries: ReadonlyArray<LibraryGame> = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    rawgId: 3498,
    title: "Hades",
    slug: "hades",
    coverUrl: null,
    releaseDate: "2020-09-17",
    status: "completed",
    rating: 9,
    note: "Combat fluidissimo e una struttura narrativa che rende ogni run significativa.",
    genres: ["Action", "Roguelike"],
    developers: ["Supergiant Games"],
    publishers: ["Supergiant Games"],
    updatedAt: "2026-09-20T12:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    rawgId: 3328,
    title: "The Witcher 3: Wild Hunt",
    slug: "the-witcher-3-wild-hunt",
    coverUrl: null,
    releaseDate: "2015-05-18",
    status: "playing",
    rating: 8,
    note: "Riprendere la questline delle Skellige.",
    genres: ["RPG"],
    developers: ["CD Projekt RED"],
    publishers: ["CD Projekt"],
    updatedAt: "2026-09-19T12:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    rawgId: 28,
    title: "Red Dead Redemption 2",
    slug: "red-dead-redemption-2",
    coverUrl: null,
    releaseDate: "2018-10-26",
    status: "backlog",
    rating: null,
    note: null,
    genres: ["Action", "Adventure"],
    developers: ["Rockstar Games"],
    publishers: ["Rockstar Games"],
    updatedAt: "2026-09-18T12:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    rawgId: 9767,
    title: "Hollow Knight",
    slug: "hollow-knight",
    coverUrl: null,
    releaseDate: "2017-02-24",
    status: "abandoned",
    rating: 7,
    note: "Bellissimo, ma al momento non ho voglia di tornare sulle sezioni più punitive.",
    genres: ["Action", "Platformer"],
    developers: ["Team Cherry"],
    publishers: ["Team Cherry"],
    updatedAt: "2026-09-17T12:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    rawgId: 3790,
    title: "Stardew Valley",
    slug: "stardew-valley",
    coverUrl: null,
    releaseDate: "2016-02-26",
    status: "completed",
    rating: 10,
    note: "La fattoria a cui torno quando voglio rallentare.",
    genres: ["RPG", "Simulation"],
    developers: ["ConcernedApe"],
    publishers: ["ConcernedApe"],
    updatedAt: "2026-09-16T12:00:00.000Z",
  },
];
const catalogToLibraryGame = (
  game: CatalogGame,
  timestamp: number,
): LibraryGame => ({
  id: crypto.randomUUID(),
  rawgId: Number(game.id),
  title: game.title,
  slug: game.slug,
  coverUrl: game.coverUrl,
  releaseDate: game.releaseDate,
  status: "backlog",
  rating: null,
  note: null,
  genres: game.genres,
  developers: game.developers,
  publishers: game.publishers,
  updatedAt: new Date(timestamp).toISOString(),
});

export const LibraryRepositoryMemory = Layer.effect(
  LibraryRepository,
  Effect.gen(function* () {
    const entries = yield* Ref.make(initialEntries);

    const modifyEntry = (
      gameId: string,
      change: (entry: LibraryGame) => LibraryGame | undefined,
    ) =>
      Ref.modify(entries, (current) => {
        if (!current.some(({ id }) => id === gameId)) return [false, current];
        return [
          true,
          current.flatMap((entry) => {
            if (entry.id !== gameId) return [entry];
            const changed = change(entry);
            return changed ? [changed] : [];
          }),
        ];
      }).pipe(
        Effect.flatMap((found) =>
          found
            ? Effect.void
            : Effect.fail(new LibraryEntryNotFound({ gameId })),
        ),
      );

    return {
      list: (filters = {}) =>
        Ref.get(entries).pipe(
          Effect.map((current) => filterLibraryGames(current, filters)),
        ),
      findById: (gameId) =>
        Ref.get(entries).pipe(
          Effect.flatMap((current) => {
            const game = current.find(({ id }) => id === gameId);
            return game
              ? Effect.succeed(game)
              : Effect.fail(new LibraryEntryNotFound({ gameId }));
          }),
        ),
      addManualGame: (game) =>
        Effect.gen(function* () {
          const timestamp = yield* Clock.currentTimeMillis;
          return yield* Ref.modify(entries, (current) => {
            const existing = current.find(({ rawgId, slug }) =>
              rawgId === null ? slug === game.slug : String(rawgId) === game.id,
            );
            if (existing) return [existing.id, current];
            const entry = catalogToLibraryGame(game, timestamp);
            return [entry.id, [entry, ...current]];
          });
        }),
      refreshCatalogGame: (gameId, game) =>
        modifyEntry(gameId, (entry) => ({
          ...entry,
          title: game.title,
          slug: game.slug,
          coverUrl: game.coverUrl,
          releaseDate: game.releaseDate,
          genres: game.genres,
          developers: game.developers,
          publishers: game.publishers,
        })),
      update: (gameId, update) =>
        Effect.gen(function* () {
          const timestamp = yield* Clock.currentTimeMillis;
          return yield* modifyEntry(gameId, (entry) => ({
            ...entry,
            ...update,
            updatedAt: new Date(timestamp).toISOString(),
          }));
        }),
      remove: (gameId) => modifyEntry(gameId, () => undefined),
    };
  }),
);
