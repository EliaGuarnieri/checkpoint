import { Schema } from "effect";

import { CatalogGameSchema, type CatalogGame } from "~/modules/catalog/model";

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

const OwnedSteamGameSchema = Schema.Struct({
  steamAppId: Schema.String,
  title: Schema.String,
});
const MatchedSteamGameSchema = Schema.Struct({
  ...OwnedSteamGameSchema.fields,
  game: CatalogGameSchema,
});
const MatchCandidateSchema = Schema.Struct({
  steamAppId: Schema.String,
  ownedTitle: Schema.String,
  candidate: CatalogGameSchema,
});
const FailedSteamGameSchema = Schema.Struct({
  ...OwnedSteamGameSchema.fields,
  reason: Schema.Literal("catalog-unavailable"),
});

export const SteamImportPreviewSchema = Schema.Struct({
  newGames: Schema.Array(MatchedSteamGameSchema),
  existingGames: Schema.Array(MatchedSteamGameSchema),
  candidates: Schema.Array(MatchCandidateSchema),
  unmatchedGames: Schema.Array(OwnedSteamGameSchema),
  failures: Schema.Array(FailedSteamGameSchema),
});
