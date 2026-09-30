import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { LibraryEntryUpdate, LibraryGameSchema, Note, Rating } from "./model";

const game = {
  id: "00000000-0000-4000-8000-000000000001",
  rawgId: 3498,
  title: "Hades",
  slug: "hades",
  coverUrl: null,
  releaseDate: null,
  status: "backlog",
  rating: null,
  note: null,
  genres: [],
  developers: [],
  publishers: [],
  updatedAt: "2026-09-30T00:00:00.000Z",
};

describe("library invariants", () => {
  it.each([0, 11, 1.5, NaN, Infinity])(
    "rejects invalid rating %s in both inputs and outputs",
    (rating) => {
      expect(Schema.is(Rating)(rating)).toBe(false);
      expect(Schema.is(LibraryEntryUpdate)({ rating })).toBe(false);
      expect(Schema.is(LibraryGameSchema)({ ...game, rating })).toBe(false);
    },
  );

  it("accepts the same note length on input and output", () => {
    const note = "a".repeat(10_000);
    expect(Schema.is(Note)(note)).toBe(true);
    expect(Schema.is(LibraryGameSchema)({ ...game, note })).toBe(true);
    expect(Schema.is(LibraryEntryUpdate)({ note: note + "a" })).toBe(false);
    expect(Schema.is(LibraryGameSchema)({ ...game, note: note + "a" })).toBe(
      false,
    );
  });
});
