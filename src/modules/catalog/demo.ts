import { Effect, Layer } from "effect";

import { demoCatalogGames } from "~/modules/catalog/demo-data";
import type { CatalogGame, CatalogGamePreview } from "~/modules/catalog/model";
import { CatalogUnavailable, GameCatalog } from "~/modules/catalog/service";

const toPreview = (game: CatalogGame): CatalogGamePreview => ({
  id: game.id,
  title: game.title,
  slug: game.slug,
  coverUrl: game.coverUrl,
  releaseDate: game.releaseDate,
  genres: game.genres,
});

export const GameCatalogDemo = Layer.succeed(GameCatalog, {
  findById: (id) => {
    const game = demoCatalogGames.find((item) => item.id === id);
    return game
      ? Effect.succeed(game)
      : Effect.fail(new CatalogUnavailable({ operation: "findById" }));
  },
  searchByTitle: (title) =>
    Effect.succeed(
      demoCatalogGames
        .filter((game) =>
          game.title
            .toLocaleLowerCase("en")
            .includes(title.toLocaleLowerCase("en")),
        )
        .map(toPreview),
    ),
});
