import { EventEmitter } from "node:events";

import { Cause, Effect, Exit, Option, Redacted } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DatabaseLive, Database } from "~/infrastructure/database/client";
import { makeAppRuntimes } from "~/infrastructure/runtime";
import { GameCatalog } from "~/modules/catalog/service";
import { LibraryRepository } from "~/modules/library/service";

const pools = vi.hoisted(() => ({
  ends: [] as Array<ReturnType<typeof vi.fn>>,
}));
vi.mock("pg", () => ({
  Pool: class extends EventEmitter {
    end = vi.fn(async () => undefined);
    constructor() {
      super();
      pools.ends.push(this.end);
    }
  },
}));

beforeEach(() => {
  pools.ends.length = 0;
  vi.stubEnv(
    "DATABASE_URL",
    "postgresql://test:private-password@localhost/test",
  );
  vi.stubEnv("RAWG_API_KEY", "test-key");
});
afterEach(() => vi.unstubAllEnvs());

const libraryProgram = Effect.gen(function* () {
  yield* LibraryRepository;
  return "library";
});
const catalogProgram = Effect.gen(function* () {
  yield* GameCatalog;
  return "catalog";
});

describe("application resource ownership", () => {
  it("shares one pool between runtimes and releases it on disposal", async () => {
    const runtimes = makeAppRuntimes();
    try {
      await runtimes.library.runPromise(libraryProgram);
      await runtimes.app.runPromise(libraryProgram);
      await runtimes.library.runPromise(libraryProgram);
      expect(pools.ends).toHaveLength(1);
      expect(pools.ends[0]).not.toHaveBeenCalled();
    } finally {
      await runtimes.dispose();
    }
    expect(pools.ends[0]).toHaveBeenCalledTimes(1);
  });

  it("does not require the catalog key for library-only programs", async () => {
    vi.stubEnv("RAWG_API_KEY", "");
    const runtimes = makeAppRuntimes();
    try {
      expect(await runtimes.library.runPromise(libraryProgram)).toBe("library");
    } finally {
      await runtimes.dispose();
    }
  });

  it("does not build a database pool for catalog-only programs", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const runtimes = makeAppRuntimes();
    try {
      expect(await runtimes.catalog.runPromise(catalogProgram)).toBe("catalog");
      expect(pools.ends).toHaveLength(0);
    } finally {
      await runtimes.dispose();
    }
  });

  it("keeps invalid configuration typed and redacted", async () => {
    vi.stubEnv("DATABASE_URL", "https://user:private-password@invalid");
    const exit = await Effect.runPromiseExit(
      Database.pipe(Effect.provide(DatabaseLive)),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const error = Option.getOrThrow(Cause.failureOption(exit.cause));
      expect(error._tag).toBe("ConfigurationInvalid");
      expect(Redacted.isRedacted(error.cause)).toBe(true);
      expect(Cause.pretty(exit.cause)).not.toContain("private-password");
    }
    expect(pools.ends).toHaveLength(0);
  });
});
