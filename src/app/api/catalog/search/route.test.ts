import { describe, expect, it, vi } from "vitest";

vi.mock("~/infrastructure/app-layer", async () => {
  const { GameCatalogFake } = await import("~/modules/catalog/fakes");
  return { makeAppLayer: () => GameCatalogFake };
});

import { GET } from "./route";

describe("catalog search route", () => {
  it("returns previews without requiring the library database", async () => {
    const response = await GET(
      new Request("http://localhost/api/catalog/search?query=Hades"),
    );

    expect(response.status).toBe(200);
    const games = await response.json();
    expect(games).toEqual([
      {
        id: "3498",
        title: "Hades",
        slug: "hades",
        coverUrl: null,
        releaseDate: "2020-09-17",
        genres: ["Action", "Roguelike"],
      },
    ]);
  });
});
