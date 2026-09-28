import { describe, expect, it } from "vitest";
import { LibraryRepositoryMemory } from "./repository-memory";
import { LibraryRepository } from "./service";
import { Effect } from "effect";

import { CatalogGame } from "../catalog/model";

const randomId = () => Math.floor(Math.random() * 1000000000).toString();

const randomGame = (): CatalogGame => {
  const id = randomId();
  return {
    id,
    title: `Test Game ${id}`,
    slug: `test-game-${id}`,
    coverUrl: null,
    releaseDate: null,
    genres: [],
    developers: [],
    publishers: [],
  };
};

describe("LibraryRepositoryMemory", () => {
  it("adds a catalog game and updates its personal entry", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;

      const fakeGame = randomGame();

      yield* repository.addManualGame(fakeGame);

      const libraryEntry = yield* repository
        .list({ query: fakeGame.title })
        .pipe(Effect.map((games) => games[0]));

      yield* repository.update(libraryEntry.id, {
        status: "playing",
        rating: 8,
        note: "Great game!",
      });

      const updatedEntry = yield* repository.findById(libraryEntry.id);
      yield* repository.remove(libraryEntry.id);
      return updatedEntry;
    }).pipe(Effect.provide(LibraryRepositoryMemory));

    const result = await Effect.runPromise(program);

    expect(result).toMatchObject({
      status: "playing",
      rating: 8,
      note: "Great game!",
    });
  });

  it("does not duplicate a catalog game or overwrite its personal fields", async () => {
    const fakeGame = randomGame();

    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;

      yield* repository.addManualGame(fakeGame);
      const before = yield* repository.findById(`memory-${fakeGame.id}`);
      yield* repository.update(before.id, { status: "playing", rating: 8 });
      yield* repository.addManualGame(fakeGame);

      const entries = (yield* repository.list()).filter(
        (entry) => entry.rawgId === Number(fakeGame.id),
      );
      return entries;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LibraryRepositoryMemory)),
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: `memory-${fakeGame.id}`,
      status: "playing",
      rating: 8,
    });
  });

  it("Catalog is actually refreshed when refreshCatalogGames is called", async () => {
    const fakeGame = randomGame();

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
    const fakeGame = randomGame();

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

  it("remove removes the entry from the library", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;

      const fakeGame = randomGame();

      yield* repository.addManualGame(fakeGame);

      const addedEntry = yield* repository
        .list({ query: fakeGame.title })
        .pipe(Effect.map((games) => games[0]));

      yield* repository.remove(addedEntry.id);

      return yield* repository.containsCatalogGame(fakeGame.id);
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LibraryRepositoryMemory)),
    );

    expect(result).toBe(false);
  });

  it("update updates the entry in the library and could be partial", async () => {
    const fakeGame = randomGame();

    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;

      yield* repository.addManualGame(fakeGame);

      const before = yield* repository
        .list({
          query: fakeGame.title,
        })
        .pipe(Effect.map((games) => games[0]));

      yield* repository.update(before.id, {
        note: "this has to be defined",
        rating: 8,
      });

      yield* repository.update(before.id, {
        status: "playing",
      });

      const after = yield* repository
        .list({
          query: fakeGame.title,
        })
        .pipe(Effect.map((games) => games[0]));

      return after;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LibraryRepositoryMemory)),
    );

    expect(result).toMatchObject({
      status: "playing",
      note: "this has to be defined",
      rating: 8,
    });
  });

  it("check entries isolation between layers instances", async () => {
    const fakeGame = randomGame();

    const addEntry = Effect.gen(function* () {
      const repository = yield* LibraryRepository;

      yield* repository.addManualGame({
        ...fakeGame,
        title: "Test game to check isolation",
        id: "909090",
      });

      return yield* repository
        .list({ query: "Test game to check isolation" })
        .pipe(Effect.map((games) => games[0]));
    });

    const entry = await Effect.runPromise(
      addEntry.pipe(Effect.provide(LibraryRepositoryMemory)),
    );

    const checkEntry = Effect.gen(function* () {
      const repository = yield* LibraryRepository;

      return yield* repository.findById(entry.id);
    });

    const result = await Effect.runPromise(
      Effect.flip(checkEntry.pipe(Effect.provide(LibraryRepositoryMemory))),
    );

    expect(result).toMatchObject({
      _tag: "LibraryEntryNotFound",
    });
  });
});
