import { Effect } from "effect";

import { CatalogUnavailable, GameCatalog } from "~/modules/catalog/service";
import { LibraryRepository } from "~/modules/library/service";
import type {
  MatchedSteamGame,
  OwnedSteamGame,
  SteamImportPreview,
} from "~/modules/steam-import/model";
import { SteamLibrary } from "~/modules/steam-import/steam-library";

type Reconciliation =
  | { readonly kind: "new"; readonly value: MatchedSteamGame }
  | { readonly kind: "existing"; readonly value: MatchedSteamGame }
  | {
      readonly kind: "candidate";
      readonly value: SteamImportPreview["candidates"][number];
    }
  | {
      readonly kind: "unmatched";
      readonly value: SteamImportPreview["unmatchedGames"][number];
    }
  | {
      readonly kind: "failure";
      readonly value: SteamImportPreview["failures"][number];
    };

const normalizeTitle = (title: string) =>
  title.toLocaleLowerCase("en").replaceAll(/[^a-z0-9]/g, "");

const reconcileOwnedGame = (ownedGame: OwnedSteamGame) =>
  Effect.gen(function* () {
    const catalog = yield* GameCatalog;
    const library = yield* LibraryRepository;
    const exactMatch = yield* catalog.findBySteamAppId(
      ownedGame.steamAppId,
      ownedGame.title,
    );

    if (exactMatch !== null) {
      const exists = yield* library.containsCatalogGame(exactMatch.id);
      return {
        kind: exists ? "existing" : "new",
        value: { ...ownedGame, game: exactMatch },
      } as Reconciliation;
    }

    const candidates = yield* catalog.searchByTitle(ownedGame.title);
    const candidate = candidates.find(
      (game) => normalizeTitle(game.title) === normalizeTitle(ownedGame.title),
    );

    return candidate === undefined
      ? ({ kind: "unmatched", value: ownedGame } as const)
      : ({
          kind: "candidate",
          value: {
            steamAppId: ownedGame.steamAppId,
            ownedTitle: ownedGame.title,
            candidate,
          },
        } as const);
  }).pipe(
    Effect.catchTag("CatalogUnavailable", () =>
      Effect.succeed({
        kind: "failure",
        value: { ...ownedGame, reason: "catalog-unavailable" },
      } as const),
    ),
  );

const emptyPreview = (): SteamImportPreview => ({
  newGames: [],
  existingGames: [],
  candidates: [],
  unmatchedGames: [],
  failures: [],
});

export const previewSteamImport = (steamId: string) =>
  Effect.gen(function* () {
    const steam = yield* SteamLibrary;
    const ownedGames = (yield* steam.getOwnedGames(steamId)).slice(0, 100);
    const results = yield* Effect.forEach(ownedGames, reconcileOwnedGame, {
      concurrency: 4,
    });

    return results.reduce<SteamImportPreview>((preview, result) => {
      switch (result.kind) {
        case "new":
          return { ...preview, newGames: [...preview.newGames, result.value] };
        case "existing":
          return {
            ...preview,
            existingGames: [...preview.existingGames, result.value],
          };
        case "candidate":
          return {
            ...preview,
            candidates: [...preview.candidates, result.value],
          };
        case "unmatched":
          return {
            ...preview,
            unmatchedGames: [...preview.unmatchedGames, result.value],
          };
        case "failure":
          return { ...preview, failures: [...preview.failures, result.value] };
      }
    }, emptyPreview());
  });

export interface ConfirmedImportGame {
  readonly steamAppId: string;
  readonly game: import("~/modules/catalog/model").CatalogGame;
}

export const confirmSteamImport = (
  confirmedGames: ReadonlyArray<ConfirmedImportGame>,
) =>
  Effect.gen(function* () {
    const library = yield* LibraryRepository;
    yield* Effect.forEach(
      confirmedGames,
      ({ game, steamAppId }) => library.importGame(game, steamAppId),
      { concurrency: 1, discard: true },
    );
    return { imported: confirmedGames.length };
  });

export type SteamImportError = CatalogUnavailable;
