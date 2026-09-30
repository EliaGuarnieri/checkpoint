import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { GameCatalogFake } from "~/modules/catalog/fakes";
import { CatalogUnavailable, GameCatalog } from "~/modules/catalog/service";
import {
  addCatalogGame,
  refreshLibraryEntry,
} from "~/modules/library/programs";
import { LibraryRepositoryMemory } from "~/modules/library/repository-memory";
import { LibraryRepository } from "~/modules/library/service";

const testLayer = Layer.merge(GameCatalogFake, LibraryRepositoryMemory);

describe("library programs", () => {
  it("adds idempotently and preserves personal data and the saved snapshot", async () => {
    const program = Effect.gen(function* () {
      const library = yield* LibraryRepository;
      const id = yield* addCatalogGame("22511");
      yield* library.update(id, {
        status: "completed",
        rating: 9,
        note: "Keep me",
      });
      const before = yield* library.findById(id);
      const repeatedId = yield* addCatalogGame("22511");
      const after = yield* library.findById(id);
      return { id, repeatedId, before, after };
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(testLayer)),
    );
    expect(result.repeatedId).toBe(result.id);
    expect(result.after).toEqual(result.before);
  });

  it("refreshes metadata while preserving the entry's personal data", async () => {
    const program = Effect.gen(function* () {
      const library = yield* LibraryRepository;
      const id = yield* addCatalogGame("22511");
      yield* library.update(id, {
        status: "playing",
        rating: 8,
        note: "Keep me",
      });
      const before = yield* library.findById(id);
      const catalog = Layer.succeed(GameCatalog, {
        findById: () =>
          Effect.succeed({
            ...before,
            id: "22511",
            title: "New metadata",
            developers: ["Updated developer"],
          }),
        searchByTitle: () => Effect.succeed([]),
      });
      const refreshed = yield* refreshLibraryEntry(id).pipe(
        Effect.provide(catalog),
      );
      return { before, refreshed };
    });
    const { before, refreshed } = await Effect.runPromise(
      program.pipe(Effect.provide(testLayer)),
    );
    expect(refreshed).toMatchObject({
      title: "New metadata",
      developers: ["Updated developer"],
      status: "playing",
      rating: 8,
      note: "Keep me",
      updatedAt: before.updatedAt,
    });
  });

  it("does not change library state when catalog lookup fails", async () => {
    const unavailableCatalog = Layer.succeed(GameCatalog, {
      findById: () =>
        Effect.fail(new CatalogUnavailable({ operation: "findById" })),
      searchByTitle: () => Effect.succeed([]),
    });
    const program = Effect.gen(function* () {
      const library = yield* LibraryRepository;
      const before = yield* library.list();
      const addedError = yield* Effect.flip(addCatalogGame("22511"));
      const refreshedError = yield* Effect.flip(
        refreshLibraryEntry(before[0]!.id),
      );
      const after = yield* library.list();
      return { before, after, addedError, refreshedError };
    });
    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(
          Layer.merge(unavailableCatalog, LibraryRepositoryMemory),
        ),
      ),
    );
    expect(result.after).toEqual(result.before);
    expect(result.addedError).toBeInstanceOf(CatalogUnavailable);
    expect(result.refreshedError).toBeInstanceOf(CatalogUnavailable);
  });
});
