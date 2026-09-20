import { Effect, Layer, Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  SteamImportTestLayer,
  confirmSteamImport,
  previewSteamImport,
} from "~/modules/steam-import";
import { GameCatalog } from "~/modules/catalog/service";
import { LibraryEntryUpdate } from "~/modules/library/model";
import { LibraryRepository } from "~/modules/library/service";
import {
  SteamLibrary,
  SteamLibraryUnavailable,
} from "~/modules/steam-import/steam-library";

const unusedRepositoryMethods = {
  list: () => Effect.succeed([]),
  findById: (gameId: string) =>
    Effect.dieMessage(`Unexpected findById: ${gameId}`),
  addManualGame: () => Effect.void,
  update: () => Effect.void,
  remove: () => Effect.void,
};

describe("previewSteamImport", () => {
  it("classifies every owned game without discarding partial failures", async () => {
    const preview = await Effect.runPromise(
      previewSteamImport("demo").pipe(Effect.provide(SteamImportTestLayer)),
    );

    expect(preview).toEqual({
      newGames: [
        expect.objectContaining({ steamAppId: "504230", title: "Celeste" }),
      ],
      existingGames: [
        expect.objectContaining({ steamAppId: "1145360", title: "Hades" }),
      ],
      candidates: [
        expect.objectContaining({
          steamAppId: "588650",
          ownedTitle: "Dead Cells",
          candidate: expect.objectContaining({ title: "Dead Cells" }),
        }),
      ],
      unmatchedGames: [
        expect.objectContaining({
          steamAppId: "999001",
          title: "Mystery Quest",
        }),
      ],
      failures: [
        expect.objectContaining({
          steamAppId: "999002",
          title: "Catalog Error",
          reason: "catalog-unavailable",
        }),
      ],
    });
  });

  it("limits a preview to the first 100 owned games", async () => {
    const ownedGames = Array.from({ length: 101 }, (_, index) => ({
      steamAppId: String(index),
      title: `Game ${index}`,
    }));
    const layer = Layer.mergeAll(
      Layer.succeed(SteamLibrary, {
        getOwnedGames: () => Effect.succeed(ownedGames),
      }),
      Layer.succeed(GameCatalog, {
        findBySteamAppId: (steamAppId, title) =>
          Effect.succeed({
            id: steamAppId,
            title,
            slug: `game-${steamAppId}`,
            coverUrl: null,
            releaseDate: null,
            genres: [],
            developers: [],
            publishers: [],
            steamAppId,
          }),
        searchByTitle: () => Effect.succeed([]),
      }),
      Layer.succeed(LibraryRepository, {
        containsCatalogGame: () => Effect.succeed(false),
        importGame: () => Effect.void,
        ...unusedRepositoryMethods,
      }),
    );

    const preview = await Effect.runPromise(
      previewSteamImport("large").pipe(Effect.provide(layer)),
    );
    expect(preview.newGames).toHaveLength(100);
  });

  it("reports an unavailable Steam library as an import failure", async () => {
    const steamFailure = Layer.succeed(SteamLibrary, {
      getOwnedGames: (steamId) =>
        Effect.fail(new SteamLibraryUnavailable({ steamId })),
    });
    await expect(
      Effect.runPromise(
        previewSteamImport("private").pipe(
          Effect.provide(steamFailure),
          Effect.provide(SteamImportTestLayer),
        ),
      ),
    ).rejects.toBeDefined();
  });

  it("persists only games explicitly passed to confirmation", async () => {
    const imported: Array<string> = [];
    const repository = Layer.succeed(LibraryRepository, {
      containsCatalogGame: () => Effect.succeed(false),
      importGame: (_game, steamAppId) =>
        Effect.sync(() => {
          imported.push(steamAppId);
        }),
      ...unusedRepositoryMethods,
    });
    const game = {
      id: "1",
      title: "Selected",
      slug: "selected",
      coverUrl: null,
      releaseDate: null,
      genres: [],
      developers: [],
      publishers: [],
      steamAppId: "10",
    };
    const result = await Effect.runPromise(
      confirmSteamImport([{ steamAppId: "10", game }]).pipe(
        Effect.provide(repository),
      ),
    );
    expect(result).toEqual({ imported: 1 });
    expect(imported).toEqual(["10"]);
  });
});

describe("LibraryEntryUpdate", () => {
  it("rejects a rating outside the 1 to 10 range", () => {
    expect(() =>
      Schema.decodeUnknownSync(LibraryEntryUpdate)({
        status: "playing",
        rating: 0,
        note: null,
      }),
    ).toThrow();
  });

  it("allows rating an abandoned game", () => {
    expect(
      Schema.decodeUnknownSync(LibraryEntryUpdate)({
        status: "abandoned",
        rating: 1,
        note: "Non faceva per me",
      }),
    ).toEqual({ status: "abandoned", rating: 1, note: "Non faceva per me" });
  });
});
