import type { LibraryFilters, LibraryGame } from "./model";

/** The search and ordering rules shared by both repository adapters and the UI. */
export function filterLibraryGames(
  games: ReadonlyArray<LibraryGame>,
  filters: LibraryFilters = {},
): Array<LibraryGame> {
  const { query, status, genre, developer, publisher, minimumRating, sort } =
    filters;
  const includes = (value: string, term: string) =>
    value.toLocaleLowerCase("it").includes(term.toLocaleLowerCase("it"));

  return games
    .filter(
      (game) =>
        (!query || includes(game.title, query)) &&
        (!status || game.status === status) &&
        (!genre || game.genres.some((value) => includes(value, genre))) &&
        (!developer ||
          game.developers.some((value) => includes(value, developer))) &&
        (!publisher ||
          game.publishers.some((value) => includes(value, publisher))) &&
        (!minimumRating ||
          (game.rating != null && game.rating >= minimumRating)),
    )
    .sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "it");
      if (sort === "rating")
        return (
          (b.rating ?? -1) - (a.rating ?? -1) ||
          a.title.localeCompare(b.title, "it")
        );
      if (sort === "releaseDate")
        return (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "");
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}
