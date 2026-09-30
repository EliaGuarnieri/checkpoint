import { DrizzleQueryError } from "drizzle-orm";
import { Cause, Effect, Exit, Option } from "effect";
import { describe, expect, it } from "vitest";

import { databaseFailure } from "./errors";

describe("database error classification", () => {
  it.each([
    "Connection terminated unexpectedly",
    "Connection terminated",
    "timeout exceeded when trying to connect",
  ])(
    "recognizes a wrapped code-less connection failure: %s",
    async (message) => {
      const error = new DrizzleQueryError("select 1", [], new Error(message));
      const failure = await Effect.runPromise(
        databaseFailure("listLibrary", error).pipe(Effect.flip),
      );
      expect(failure._tag).toBe("DatabaseUnavailable");
    },
  );
  it("unwraps connection failures without classifying SQL constraints as unavailable", async () => {
    const connection = await Effect.runPromise(
      databaseFailure("listLibrary", { cause: { code: "ECONNRESET" } }).pipe(
        Effect.flip,
      ),
    );
    const constraint = await Effect.runPromise(
      databaseFailure("addManualGame", { cause: { code: "23505" } }).pipe(
        Effect.flip,
      ),
    );
    expect(connection).toMatchObject({
      _tag: "DatabaseUnavailable",
      code: "ECONNRESET",
    });
    expect(constraint).toMatchObject({
      _tag: "DatabaseQueryFailed",
      code: "23505",
    });
  });

  it("preserves impossible results and programming exceptions as defects", async () => {
    const bug = new Error("Game upsert returned no row");
    const exit = await Effect.runPromiseExit(
      databaseFailure("addManualGame", bug),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(Option.getOrUndefined(Cause.dieOption(exit.cause))).toBe(bug);
      expect(Option.isNone(Cause.failureOption(exit.cause))).toBe(true);
    }
  });
});
