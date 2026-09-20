import { Effect, Layer } from "effect";

import type { CatalogGame } from "~/modules/catalog/model";
import type { LibraryFilters, LibraryGame } from "~/modules/library/model";
import {
  LibraryEntryNotFound,
  LibraryRepository,
} from "~/modules/library/service";

let entries: Array<LibraryGame> = [
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

const catalogToLibraryGame = (game: CatalogGame): LibraryGame => ({
  id: `memory-${game.id}`,
  rawgId: Number.isFinite(Number(game.id)) ? Number(game.id) : null,
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
  updatedAt: new Date().toISOString(),
});

const filterEntries = (filters: LibraryFilters) => {
  const filtered = entries.filter((game) => {
    if (
      filters.query &&
      !game.title.toLowerCase().includes(filters.query.toLowerCase())
    )
      return false;
    if (filters.status && game.status !== filters.status) return false;
    if (filters.genre && !game.genres.includes(filters.genre)) return false;
    if (filters.developer && !game.developers.includes(filters.developer))
      return false;
    if (filters.publisher && !game.publishers.includes(filters.publisher))
      return false;
    if (filters.minimumRating && (game.rating ?? 0) < filters.minimumRating)
      return false;
    return true;
  });
  return filtered.toSorted((left, right) => {
    if (filters.sort === "title") return left.title.localeCompare(right.title);
    if (filters.sort === "rating")
      return (right.rating ?? -1) - (left.rating ?? -1);
    if (filters.sort === "releaseDate")
      return (right.releaseDate ?? "").localeCompare(left.releaseDate ?? "");
    return right.updatedAt.localeCompare(left.updatedAt);
  });
};

export const LibraryRepositoryMemory = Layer.succeed(LibraryRepository, {
  containsCatalogGame: (catalogGameId) =>
    Effect.succeed(
      entries.some((game) => String(game.rawgId) === catalogGameId),
    ),
  list: (filters = {}) => Effect.succeed(filterEntries(filters)),
  findById: (gameId) => {
    const game = entries.find(({ id }) => id === gameId);
    return game
      ? Effect.succeed(game)
      : Effect.fail(new LibraryEntryNotFound({ gameId }));
  },
  importGame: (game) =>
    Effect.sync(() => {
      if (!entries.some(({ rawgId }) => String(rawgId) === game.id))
        entries = [catalogToLibraryGame(game), ...entries];
    }),
  addManualGame: (game) =>
    Effect.sync(() => {
      if (!entries.some(({ rawgId }) => String(rawgId) === game.id))
        entries = [catalogToLibraryGame(game), ...entries];
    }),
  update: (gameId, update) => {
    const index = entries.findIndex(({ id }) => id === gameId);
    if (index < 0) return Effect.fail(new LibraryEntryNotFound({ gameId }));
    entries = entries.map((entry) =>
      entry.id === gameId
        ? { ...entry, ...update, updatedAt: new Date().toISOString() }
        : entry,
    );
    return Effect.void;
  },
  remove: (gameId) => {
    if (!entries.some(({ id }) => id === gameId))
      return Effect.fail(new LibraryEntryNotFound({ gameId }));
    entries = entries.filter(({ id }) => id !== gameId);
    return Effect.void;
  },
});
