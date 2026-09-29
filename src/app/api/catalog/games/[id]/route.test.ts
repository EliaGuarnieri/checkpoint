import { describe, expect, it, vi } from "vitest";

vi.mock("~/infrastructure/app-layer", async () => {
  const { GameCatalogFake } = await import("~/modules/catalog/fakes");
  return { makeAppLayer: () => GameCatalogFake };
});

import { GET } from "./route";

describe("catalog game detail route", () => {
  it("reads catalog details without a library repository", async () => {
    const response = await GET(
      new Request("http://localhost/api/catalog/games/3498"),
      { params: Promise.resolve({ id: "3498" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "3498",
      title: "Hades",
    });
  });
});
