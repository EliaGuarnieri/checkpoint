import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/infrastructure/app-layer", async () => {
  const { GameCatalog } = await import("~/modules/catalog/service");
  const { LibraryRepositoryMemory } =
    await import("~/modules/library/repository-memory");
  return {
    makeAppLayer: () =>
      Layer.mergeAll(
        Layer.succeed(GameCatalog, {
          searchByTitle: () => Effect.succeed([]),
          findById: () =>
            Effect.succeed({
              id: "3498",
              title: "Hades aggiornato",
              slug: "hades",
              coverUrl: null,
              releaseDate: "2020-09-17",
              genres: ["Action"],
              developers: ["Supergiant Games"],
              publishers: ["Supergiant Games"],
            }),
        }),
        LibraryRepositoryMemory,
      ),
  };
});

import { POST } from "./route";

describe("refresh library entry route", () => {
  it("rejects a malformed library id before accessing the repository", async () => {
    const response = await POST(
      new Request("http://localhost/api/library/not-a-uuid/refresh", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "ParseError" });
  });

  it("updates the snapshot and preserves personal fields", async () => {
    const response = await POST(
      new Request(
        "http://localhost/api/library/00000000-0000-4000-8000-000000000001/refresh",
        {
          method: "POST",
        },
      ),
      {
        params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      title: "Hades aggiornato",
      status: "completed",
      rating: 9,
    });
  });
});
