import { Effect, Layer } from "effect";

import type { CatalogGame } from "~/modules/catalog/model";
import { CatalogUnavailable, GameCatalog } from "~/modules/catalog/service";

const catalogGames: ReadonlyArray<CatalogGame> = [
  {
    id: "3498",
    title: "Hades",
    slug: "hades",
    coverUrl: null,
    releaseDate: "2020-09-17",
    genres: ["Action", "Roguelike"],
    developers: ["Supergiant Games"],
    publishers: ["Supergiant Games"],
  },
  {
    id: "22511",
    title: "Celeste",
    slug: "celeste",
    coverUrl: null,
    releaseDate: "2018-01-25",
    genres: ["Platformer"],
    developers: ["Maddy Makes Games"],
    publishers: ["Maddy Makes Games"],
  },
  {
    id: "4291",
    title: "Dead Cells",
    slug: "dead-cells",
    coverUrl: null,
    releaseDate: "2018-08-07",
    genres: ["Action", "Platformer"],
    developers: ["Motion Twin"],
    publishers: ["Motion Twin"],
  },
];

export const GameCatalogFake = Layer.succeed(GameCatalog, {
  findById: (id) => {
    const game = catalogGames.find((item) => item.id === id);
    return game
      ? Effect.succeed(game)
      : Effect.fail(new CatalogUnavailable({ operation: "findById" }));
  },
  searchByTitle: (title) =>
    Effect.succeed(
      catalogGames.filter((game) =>
        game.title
          .toLocaleLowerCase("en")
          .includes(title.toLocaleLowerCase("en")),
      ),
    ),
});
