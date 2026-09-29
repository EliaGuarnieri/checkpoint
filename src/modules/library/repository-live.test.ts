import { ConfigProvider, Effect } from "effect";
import { describe, expect, it } from "vitest";

import { LibraryRepositoryLive } from "./repository-live";
import { LibraryRepository } from "./service";

describe("LibraryRepository configuration", () => {
  it("reports a missing DATABASE_URL through the repository error channel", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* LibraryRepository;
      return yield* repository.list();
    }).pipe(
      Effect.provide(LibraryRepositoryLive),
      Effect.withConfigProvider(ConfigProvider.fromMap(new Map())),
      Effect.flip,
    );

    const error = await Effect.runPromise(program);

    expect(error).toMatchObject({
      _tag: "DatabaseUnavailable",
      operation: "listLibrary",
    });
  });
});
