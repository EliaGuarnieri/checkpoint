import { ConfigProvider, Effect } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeAppLayer } from "~/infrastructure/app-layer";
import { GameCatalogFake } from "~/modules/catalog/fakes";
import { GameCatalog } from "~/modules/catalog/service";

const searchCatalog = Effect.gen(function* () {
  const catalog = yield* GameCatalog;
  return yield* catalog.searchByTitle("Celeste");
});

const searchWithConfig = (
  entries: ReadonlyArray<readonly [string, string]>,
) => {
  const provider = ConfigProvider.fromMap(new Map(entries));
  return searchCatalog.pipe(
    Effect.provide(makeAppLayer()),
    Effect.withConfigProvider(provider),
  );
};

afterEach(() => vi.unstubAllGlobals());

describe("configured game catalog", () => {
  it("uses the fake catalog when a test provides its layer explicitly", async () => {
    const games = await Effect.runPromise(
      searchCatalog.pipe(Effect.provide(GameCatalogFake)),
    );

    expect(games.map((game) => game.title)).toEqual(["Celeste"]);
  });

  it("uses RAWG when the key is configured", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input instanceof Request ? input.url : input);
      expect(url.searchParams.get("key")).toBe("test-key");

      const game = {
        id: 1,
        name: "Celeste from RAWG",
        slug: "celeste-from-rawg",
        background_image: null,
        released: null,
        genres: [],
      };
      return Response.json(
        url.pathname.endsWith("/games")
          ? { results: [game] }
          : { ...game, developers: [], publishers: [] },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const games = await Effect.runPromise(
      searchWithConfig([["RAWG_API_KEY", "test-key"]]),
    );

    expect(games.map((game) => game.title)).toEqual(["Celeste from RAWG"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("loads a single RAWG game with its cover", async () => {
    const coverUrl = "https://media.rawg.io/media/games/example.jpg";
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input instanceof Request ? input.url : input);
      expect(url.pathname).toBe("/api/games/3498");
      expect(url.searchParams.get("key")).toBe("test-key");
      return Response.json({
        id: 3498,
        name: "Hades",
        slug: "hades",
        background_image: coverUrl,
        released: "2020-09-17",
        genres: [],
        developers: [],
        publishers: [],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const game = await Effect.runPromise(
      Effect.gen(function* () {
        const catalog = yield* GameCatalog;
        return yield* catalog.findById("3498");
      }).pipe(
        Effect.provide(makeAppLayer()),
        Effect.withConfigProvider(
          ConfigProvider.fromMap(new Map([["RAWG_API_KEY", "test-key"]])),
        ),
      ),
    );

    expect(game.coverUrl).toBe(coverUrl);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects app configuration without a RAWG key", async () => {
    await expect(Effect.runPromise(searchWithConfig([]))).rejects.toThrow(
      "RAWG_API_KEY",
    );
  });

  it("rejects an empty RAWG key", async () => {
    await expect(
      Effect.runPromise(searchWithConfig([["RAWG_API_KEY", " "]])),
    ).rejects.toThrow("Invalid data at RAWG_API_KEY");
  });
});
