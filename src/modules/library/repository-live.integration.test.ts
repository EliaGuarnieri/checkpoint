import { ConfigProvider, Effect, Redacted } from "effect";
import { describe, expect, it, vi } from "vitest";

import { getDatabase } from "~/infrastructure/database/client";

import { LibraryRepositoryLive } from "./repository-live";
import { LibraryRepository } from "./service";

const testDatabaseUrl =
  "postgres://checkpoint:checkpoint@localhost:5433/checkpoint_test";
const testConfig = ConfigProvider.fromMap(
  new Map([["DATABASE_URL", testDatabaseUrl]]),
);

describe("LibraryRepository with PostgreSQL", () => {
  it("persists a library entry through the Effect repository interface", async () => {
    const id = crypto.randomUUID();
    const game = {
      id,
      title: `Integration Game ${id}`,
      slug: `integration-game-${id}`,
      coverUrl: null,
      releaseDate: null,
      genres: ["RPG"],
      developers: ["Integration Studio"],
      publishers: [],
    };

    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;
      const addedId = yield* repository.addManualGame(game);
      const repeatedId = yield* repository.addManualGame({
        ...game,
        title: "Unwanted replacement title",
      });
      expect(repeatedId).toBe(addedId);

      const [added] = yield* repository.list({ query: game.title });
      expect(added).toMatchObject({ title: game.title, status: "backlog" });
      expect(added.id).toBe(addedId);

      const matchingGenre = yield* repository.list({ genre: "rp" });
      expect(matchingGenre.map(({ id }) => id)).toContain(addedId);

      yield* repository.update(added.id, {
        status: "playing",
        rating: 8,
        note: "Da continuare",
      });
      yield* repository.refreshCatalogGame(added.id, {
        ...game,
        title: `${game.title} refreshed`,
        genres: ["Adventure"],
      });
      const updated = yield* repository.findById(added.id);
      yield* repository.remove(added.id);

      return updated;
    }).pipe(
      Effect.provide(LibraryRepositoryLive),
      Effect.withConfigProvider(testConfig),
    );

    await expect(Effect.runPromise(program)).resolves.toMatchObject({
      title: `${game.title} refreshed`,
      genres: ["Adventure"],
      status: "playing",
      rating: 8,
      note: "Da continuare",
    });
  });

  it("rolls back the snapshot when the library entry cannot be inserted", async () => {
    const db = getDatabase(Redacted.make(testDatabaseUrl));
    const slug = `rollback-test-${crypto.randomUUID()}`;
    await db.$client.query(
      "ALTER TABLE library_entries ADD CONSTRAINT reject_new_backlog_for_test CHECK (status <> 'backlog') NOT VALID",
    );

    try {
      const add = Effect.gen(function* () {
        const repository = yield* LibraryRepository;
        return yield* repository.addManualGame({
          id: crypto.randomUUID(),
          title: "Rollback test",
          slug,
          coverUrl: null,
          releaseDate: null,
          genres: ["RPG"],
          developers: [],
          publishers: [],
        });
      }).pipe(
        Effect.provide(LibraryRepositoryLive),
        Effect.withConfigProvider(testConfig),
      );

      await expect(Effect.runPromise(add)).rejects.toThrow();
      const snapshot = await db.$client.query(
        "SELECT id FROM games WHERE slug = $1",
        [slug],
      );
      expect(snapshot.rows).toHaveLength(0);
    } finally {
      await db.$client.query(
        "ALTER TABLE library_entries DROP CONSTRAINT reject_new_backlog_for_test",
      );
    }
  });

  it("loads metadata for several entries in three queries", async () => {
    const marker = crypto.randomUUID();
    const gameIds = [crypto.randomUUID(), crypto.randomUUID()];
    const setup = Effect.gen(function* () {
      const repository = yield* LibraryRepository;
      return yield* Effect.forEach(gameIds, (id, index) =>
        repository.addManualGame({
          id,
          title: `Batch game ${index}`,
          slug: `batch-${marker}-${index}`,
          coverUrl: null,
          releaseDate: null,
          genres: [index === 0 ? "Action" : "Adventure"],
          developers: [`Studio ${index}`],
          publishers: [],
        }),
      );
    }).pipe(
      Effect.provide(LibraryRepositoryLive),
      Effect.withConfigProvider(testConfig),
    );
    const addedIds = await Effect.runPromise(setup);
    const querySpy = vi.spyOn(
      getDatabase(Redacted.make(testDatabaseUrl)).$client,
      "query",
    );

    try {
      const entries = await Effect.runPromise(
        Effect.gen(function* () {
          const repository = yield* LibraryRepository;
          return yield* repository.list();
        }).pipe(
          Effect.provide(LibraryRepositoryLive),
          Effect.withConfigProvider(testConfig),
        ),
      );
      const added = entries.filter(({ id }) => addedIds.includes(id));
      expect(added).toHaveLength(2);
      expect(added.find(({ id }) => id === addedIds[0])?.genres).toEqual([
        "Action",
      ]);
      expect(added.find(({ id }) => id === addedIds[1])?.genres).toEqual([
        "Adventure",
      ]);
      expect(querySpy).toHaveBeenCalledTimes(3);
    } finally {
      querySpy.mockRestore();
      await Effect.runPromise(
        Effect.gen(function* () {
          const repository = yield* LibraryRepository;
          yield* Effect.forEach(addedIds, (id) => repository.remove(id));
        }).pipe(
          Effect.provide(LibraryRepositoryLive),
          Effect.withConfigProvider(testConfig),
        ),
      );
    }
  });
});
