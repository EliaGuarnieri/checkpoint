import { Effect, Layer, Schema, TestClock, TestContext } from "effect";
import { describe, expect, it } from "vitest";

import type { CatalogGame } from "../catalog/model";
import { LibraryEntryId, LibraryGameSchema } from "./model";
import { LibraryRepositoryMemory } from "./repository-memory";
import { LibraryEntryNotFound, LibraryRepository } from "./service";

const game: CatalogGame = {
  id: "909090",
  title: "Effect learning game",
  slug: "effect-learning-game",
  coverUrl: null,
  releaseDate: null,
  genres: [],
  developers: [],
  publishers: [],
};

describe("LibraryRepositoryMemory as an Effect learning example", () => {
  it("composes repository operations through an injected service", async () => {
    // The program requires LibraryRepository; it does not choose its implementation.
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;
      const entryId = yield* repository.addManualGame(game);

      yield* repository.update(entryId, {
        status: "playing",
        rating: 8,
        note: "Learning Effect",
      });

      return yield* repository.findById(entryId);
    });

    // provide supplies the Layer, while runPromise executes the complete program.
    const entry = await Effect.runPromise(
      program.pipe(Effect.provide(LibraryRepositoryMemory)),
    );

    expect(Schema.is(LibraryEntryId)(entry.id)).toBe(true);
    expect(Schema.is(LibraryGameSchema)(entry)).toBe(true);
    expect(entry).toMatchObject({
      title: game.title,
      status: "playing",
      rating: 8,
      note: "Learning Effect",
    });
  });

  it("exposes a missing entry through the typed error channel", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;
      const entryId = yield* repository.addManualGame(game);
      yield* repository.remove(entryId);
      return yield* repository.findById(entryId);
    });

    // flip turns a typed failure into a value that the test can inspect.
    const error = await Effect.runPromise(
      program.pipe(Effect.provide(LibraryRepositoryMemory), Effect.flip),
    );

    expect(error).toBeInstanceOf(LibraryEntryNotFound);
    expect(error).toMatchObject({
      _tag: "LibraryEntryNotFound",
    });
  });

  it("allocates independent state for each Layer provision", async () => {
    const addEntry = Effect.gen(function* () {
      const repository = yield* LibraryRepository;
      return yield* repository.addManualGame(game);
    });

    const entryId = await Effect.runPromise(
      addEntry.pipe(Effect.provide(LibraryRepositoryMemory)),
    );

    const findEntry = Effect.gen(function* () {
      const repository = yield* LibraryRepository;
      return yield* repository.findById(entryId);
    });

    // A separate execution builds a fresh Layer instance without the added entry.
    const error = await Effect.runPromise(
      findEntry.pipe(Effect.provide(LibraryRepositoryMemory), Effect.flip),
    );

    expect(error).toBeInstanceOf(LibraryEntryNotFound);
    expect(error).toMatchObject({ gameId: entryId });
  });
  it("does not mutate on construction and reuses reads against current state", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;
      const id = yield* repository.addManualGame(game);
      const read = repository.findById(id);
      const update = repository.update(id, { rating: 7 });
      const remove = repository.remove(id);
      const before = yield* read;
      yield* update;
      const after = yield* read;
      yield* remove;
      const missing = yield* Effect.flip(read);
      return { before, after, missing };
    });
    const { before, after, missing } = await Effect.runPromise(
      program.pipe(Effect.provide(LibraryRepositoryMemory)),
    );
    expect(before.rating).toBeNull();
    expect(after.rating).toBe(7);
    expect(missing).toBeInstanceOf(LibraryEntryNotFound);
  });

  it("keeps concurrent additions unique", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;
      const ids = yield* Effect.all(
        Array.from({ length: 10 }, () => repository.addManualGame(game)),
        { concurrency: "unbounded" },
      );
      const entries = yield* repository.list();
      return { ids, entries };
    });
    const { ids, entries } = await Effect.runPromise(
      program.pipe(Effect.provide(LibraryRepositoryMemory)),
    );
    expect(new Set(ids).size).toBe(1);
    expect(
      entries.filter(({ rawgId }) => rawgId === Number(game.id)),
    ).toHaveLength(1);
  });

  it("uses the Effect clock for timestamps", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;
      yield* TestClock.setTime(1_000);
      const id = yield* repository.addManualGame(game);
      const added = yield* repository.findById(id);
      yield* TestClock.setTime(2_000);
      yield* repository.update(id, { status: "playing" });
      const updated = yield* repository.findById(id);
      return { added, updated };
    });
    const { added, updated } = await Effect.runPromise(
      program.pipe(
        Effect.provide(
          Layer.merge(LibraryRepositoryMemory, TestContext.TestContext),
        ),
      ),
    );
    expect(added.updatedAt).toBe(new Date(1_000).toISOString());
    expect(updated.updatedAt).toBe(new Date(2_000).toISOString());
  });
});
