import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { LibraryRepositoryLive } from "./repository-live";
import { LibraryRepository } from "./service";

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
      yield* repository.addManualGame(game);

      const [added] = yield* repository.list({ query: game.title });
      expect(added).toMatchObject({ title: game.title, status: "backlog" });

      yield* repository.update(added.id, {
        status: "playing",
        rating: 8,
        note: "Da continuare",
      });
      const updated = yield* repository.findById(added.id);
      yield* repository.remove(added.id);

      return updated;
    }).pipe(Effect.provide(LibraryRepositoryLive));

    await expect(Effect.runPromise(program)).resolves.toMatchObject({
      status: "playing",
      rating: 8,
      note: "Da continuare",
    });
  });
});
