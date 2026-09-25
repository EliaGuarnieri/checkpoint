import { describe, expect, it } from "vitest";
import { LibraryRepositoryMemory } from "./repository-memory";
import { LibraryRepository } from "./service";
import { Effect } from "effect";

import { CatalogGame } from "../catalog/model";

const fakeGame = {
  id: "900001",
  title: "Manual Game",
  slug: "manual-game",
  coverUrl: null,
  releaseDate: null,
  genres: [],
  developers: [],
  publishers: [],
  steamAppId: null,
} satisfies CatalogGame;

describe("LibraryRepositoryMemory", () => {
  it("Check that a game can be added manually and updated on import", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;

      yield* repository.addManualGame(fakeGame);

      const libraryEntry = yield* repository
        .list({ query: fakeGame.title })
        .pipe(Effect.map((games) => games[0]));

      yield* repository.update(libraryEntry.id, {
        status: "playing",
        rating: 8,
        note: "Great game!",
      });

      yield* repository.importGame(
        {
          ...fakeGame,
          title: "Manual imported Game",
          steamAppId: "demo imported",
        },
        "demo",
      );

      const updatedEntry = yield* repository.findById(libraryEntry.id);
      yield* repository.remove(libraryEntry.id);
      return updatedEntry;
    }).pipe(Effect.provide(LibraryRepositoryMemory));

    const result = await Effect.runPromise(program);

    expect(result).toMatchObject({
      title: "Manual imported Game",
      status: "playing",
      rating: 8,
      note: "Great game!",
    });
  });

  it("preserve id and updatedAt when importing a catalog game", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;

      const game = yield* repository
        .list({ query: "Hades" })
        .pipe(Effect.map((games) => games[0]));

      yield* repository.importGame(
        {
          ...game,
          id: "3498",
          steamAppId: "1145360",
        },
        "1145360",
      );

      const importedGame = yield* repository
        .list({ query: "Hades" })
        .pipe(Effect.map((games) => games[0]));

      return {
        before: game,
        after: importedGame,
      };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LibraryRepositoryMemory)),
    );

    expect({
      id: result.before.id,
      updatedAt: result.before.updatedAt,
    }).toMatchObject({
      id: result.after.id,
      updatedAt: result.after.updatedAt,
    });
  });

  it("do not import a catalog game if it already exists in the library", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;

      yield* repository.importGame(
        {
          ...fakeGame,
          steamAppId: "demo",
        },
        "demo",
      );

      yield* repository.importGame(
        {
          ...fakeGame,
          steamAppId: "demo",
        },
        "demo",
      );

      const library = yield* repository.list();

      const importedEntries = library.filter(
        (entry) => entry.rawgId === Number(fakeGame.id),
      );

      yield* Effect.forEach(importedEntries, (entry) =>
        repository.remove(entry.id),
      );

      return library;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LibraryRepositoryMemory)),
    );

    expect(
      result.filter((game) => game.rawgId === Number(fakeGame.id)),
    ).toHaveLength(1);
  });

  it("Catalog is actually refreshed when refreshCatalogGames is called", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;

      yield* repository.addManualGame(fakeGame);

      const addedEntry = yield* repository
        .list({ query: fakeGame.title })
        .pipe(Effect.map((games) => games[0]));

      yield* repository.update(addedEntry.id, {
        status: "playing",
        rating: 8,
        note: "Great game!",
      });

      yield* repository.refreshCatalogGames([
        {
          ...fakeGame,
          title: "Manual Game Updated",
        },
      ]);

      const refreshedGame = yield* repository.findById(addedEntry.id);

      yield* repository.remove(addedEntry.id);

      return refreshedGame;
    }).pipe(Effect.provide(LibraryRepositoryMemory));

    const result = await Effect.runPromise(program);

    expect(result).toMatchObject({
      title: "Manual Game Updated",
      status: "playing",
      rating: 8,
      note: "Great game!",
    });
  });

  it("refreshCatalogGames does not add new entries to the library", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;

      yield* repository.refreshCatalogGames([
        {
          ...fakeGame,
          id: "900002",
        },
      ]);

      return yield* repository.containsCatalogGame("900002");
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LibraryRepositoryMemory)),
    );

    expect(result).toBe(false);
  });
});
