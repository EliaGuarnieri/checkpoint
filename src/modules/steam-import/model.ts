import type { CatalogGame } from "~/modules/catalog/model";

export interface OwnedSteamGame {
  readonly steamAppId: string;
  readonly title: string;
}

export interface MatchedSteamGame extends OwnedSteamGame {
  readonly game: CatalogGame;
}

export interface MatchCandidate {
  readonly steamAppId: string;
  readonly ownedTitle: string;
  readonly candidate: CatalogGame;
}

export interface FailedSteamGame extends OwnedSteamGame {
  readonly reason: "catalog-unavailable";
}

export interface SteamImportPreview {
  readonly newGames: ReadonlyArray<MatchedSteamGame>;
  readonly existingGames: ReadonlyArray<MatchedSteamGame>;
  readonly candidates: ReadonlyArray<MatchCandidate>;
  readonly unmatchedGames: ReadonlyArray<OwnedSteamGame>;
  readonly failures: ReadonlyArray<FailedSteamGame>;
}
