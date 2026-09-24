import { Effect, Layer, Option } from "effect";

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
    steamAppId: "1145360",
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
    steamAppId: "504230",
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
    steamAppId: null,
  },
];

export const GameCatalogFake = Layer.succeed(GameCatalog, {
  findBySteamAppId: (steamAppId) =>
    steamAppId === "999002"
      ? Effect.fail(new CatalogUnavailable({ operation: "findBySteamAppId" }))
      : Effect.succeed(
          Option.fromNullable(
            catalogGames.find((game) => game.steamAppId === steamAppId),
          ),
        ),
  searchByTitle: (title) =>
    Effect.succeed(
      catalogGames.filter((game) =>
        game.title
          .toLocaleLowerCase("en")
          .includes(title.toLocaleLowerCase("en")),
      ),
    ),
});
