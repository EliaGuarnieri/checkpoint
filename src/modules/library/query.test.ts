import { describe, expect, it } from "vitest";

import type { LibraryGame } from "./model";
import { filterLibraryGames } from "./query";

const entries: ReadonlyArray<LibraryGame> = [
  {
    id: "one",
    rawgId: 1,
    title: "Hades",
    slug: "hades",
    coverUrl: null,
    releaseDate: "2020-09-17",
    status: "completed",
    rating: 9,
    note: null,
    genres: ["Action", "Roguelike"],
    developers: ["Supergiant Games"],
    publishers: ["Supergiant Games"],
    updatedAt: "2026-09-20T12:00:00.000Z",
  },
  {
    id: "two",
    rawgId: 2,
    title: "Celeste",
    slug: "celeste",
    coverUrl: null,
    releaseDate: "2018-01-25",
    status: "playing",
    rating: 9,
    note: null,
    genres: ["Platformer"],
    developers: ["Maddy Makes Games"],
    publishers: ["Maddy Makes Games"],
    updatedAt: "2026-09-19T12:00:00.000Z",
  },
];

describe("library search policy", () => {
  it("matches metadata fragments without case sensitivity", () => {
    expect(
      filterLibraryGames(entries, {
        genre: "ROGUE",
        developer: "SUPERGIANT",
        publisher: "games",
      }).map(({ id }) => id),
    ).toEqual(["one"]);
  });

  it("sorts equal ratings by title without changing the source array", () => {
    expect(
      filterLibraryGames(entries, { sort: "rating" }).map(({ id }) => id),
    ).toEqual(["two", "one"]);
    expect(entries.map(({ id }) => id)).toEqual(["one", "two"]);
  });
});
