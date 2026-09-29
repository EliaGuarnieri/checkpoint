import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CatalogGame } from "~/modules/catalog/model";
import type { LibraryRepositoryService } from "~/modules/library/service";

const captured = vi.hoisted(() => ({ game: null as CatalogGame | null }));

vi.mock("~/infrastructure/app-layer", async () => {
  const { GameCatalogFake } = await import("~/modules/catalog/fakes");
  const { LibraryEntryNotFound, LibraryRepository } =
    await import("~/modules/library/service");
  const repository: LibraryRepositoryService = {
    refreshCatalogGames: () => Effect.void,
    containsCatalogGame: () => Effect.succeed(false),
    list: () => Effect.succeed([]),
    findById: (gameId) => Effect.fail(new LibraryEntryNotFound({ gameId })),
    addManualGame: (game) =>
      Effect.sync(() => {
        captured.game = game;
      }),
    update: () => Effect.void,
    remove: () => Effect.void,
  };
  return {
    makeAppLayer: () =>
      Layer.mergeAll(
        GameCatalogFake,
        Layer.succeed(LibraryRepository, repository),
      ),
  };
});

import { POST } from "./route";

beforeEach(() => {
  captured.game = null;
});

describe("add catalog game route", () => {
  it("resolves the full catalog game from its ID before saving", async () => {
    const response = await POST(
      new Request("http://localhost/api/library", {
        method: "POST",
        body: JSON.stringify({ id: "3498" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(captured.game).toMatchObject({
      id: "3498",
      developers: ["Supergiant Games"],
      publishers: ["Supergiant Games"],
    });
  });

  it("rejects an invalid catalog ID without saving", async () => {
    const response = await POST(
      new Request("http://localhost/api/library", {
        method: "POST",
        body: JSON.stringify({ id: "not-an-id" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(captured.game).toBeNull();
  });
});
