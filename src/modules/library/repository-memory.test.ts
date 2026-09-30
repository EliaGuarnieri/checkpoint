import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import type { CatalogGame } from "../catalog/model";
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

    expect(entry).toMatchObject({
      id: `memory-${game.id}`,
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
      gameId: `memory-${game.id}`,
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
});
