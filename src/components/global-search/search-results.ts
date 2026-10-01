import type { CatalogGamePreview } from "~/modules/catalog/model";
import type { LibraryGame } from "~/modules/library/model";

export type SearchResult =
  | { kind: "library"; game: LibraryGame }
  | { kind: "catalog"; game: CatalogGamePreview };

export function getSearchResults(
  libraryGames: ReadonlyArray<LibraryGame>,
  catalogGames: ReadonlyArray<CatalogGamePreview>,
  query: string,
) {
  const normalized = query.trim().toLocaleLowerCase("it");
  const libraryMatches = libraryGames
    .filter((game) => game.title.toLocaleLowerCase("it").includes(normalized))
    .slice(0, 5);
  const ownedByRawgId = new Map(
    libraryGames
      .filter((game) => game.rawgId !== null)
      .map((game) => [game.rawgId, game] as const),
  );
  const ownedBySlug = new Map(
    libraryGames.map((game) => [game.slug, game] as const),
  );
  const findOwned = (game: CatalogGamePreview) =>
    ownedByRawgId.get(Number(game.id)) ?? ownedBySlug.get(game.slug);
  for (const game of catalogGames) {
    const owned = findOwned(game);
    if (owned && !libraryMatches.some((match) => match.id === owned.id)) {
      libraryMatches.push(owned);
    }
  }
  const catalogMatches = catalogGames
    .filter((game) => !findOwned(game))
    .slice(0, 6);
  const results: SearchResult[] = [
    ...libraryMatches.map((game) => ({ kind: "library" as const, game })),
    ...catalogMatches.map((game) => ({ kind: "catalog" as const, game })),
  ];
  return { libraryMatches, catalogMatches, results };
}
