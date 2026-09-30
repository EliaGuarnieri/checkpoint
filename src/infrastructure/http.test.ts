import { Cause, Effect, Layer, Logger, ManagedRuntime, Redacted } from "effect";
import { describe, expect, it } from "vitest";

import { ConfigurationInvalid } from "~/infrastructure/config";
import { runHttp, type HttpError } from "~/infrastructure/http";
import { InvalidJsonBody } from "~/infrastructure/request";
import {
  CatalogHttpError,
  CatalogTimeout,
  CatalogUnavailable,
} from "~/modules/catalog/service";
import {
  DatabaseQueryFailed,
  DatabaseUnavailable,
  LibraryEntryNotFound,
} from "~/modules/library/service";

const request = new Request("http://localhost/api/library");
const logs: Array<string> = [];
const logger = Logger.make(({ message }) => {
  logs.push(String(message));
});
const runtimeLayer = Logger.replace(Logger.defaultLogger, logger);
const execute = async (effect: Effect.Effect<unknown, HttpError>) => {
  const runtime = ManagedRuntime.make(runtimeLayer);
  try {
    return await runHttp(effect, runtime, request);
  } finally {
    await runtime.dispose();
  }
};

describe("HTTP boundary", () => {
  it.each([
    [new LibraryEntryNotFound({ gameId: "missing" }), 404],
    [new InvalidJsonBody({ cause: new Error("invalid") }), 400],
    [new DatabaseUnavailable({ operation: "listLibrary" }), 503],
    [
      new DatabaseQueryFailed({
        operation: "listLibrary",
        code: "23505",
        cause: Redacted.make(new Error("query")),
      }),
      500,
    ],
    [
      new ConfigurationInvalid({
        setting: "DATABASE_URL",
        cause: Redacted.make(new Error("private-password")),
      }),
      500,
    ],
    [new CatalogHttpError({ status: 404 }), 404],
    [new CatalogTimeout(), 504],
  ] satisfies Array<[HttpError, number]>)(
    "maps %s to HTTP %s without publishing causes",
    async (error, status) => {
      const response = await execute(Effect.fail(error));
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ error: error._tag });
    },
  );

  it("keeps defects distinct even when the cause includes an expected failure", async () => {
    const response = await execute(
      Effect.failCause(
        Cause.parallel(
          Cause.fail(new CatalogUnavailable({ operation: "request" })),
          Cause.die(new Error("programming error")),
        ),
      ),
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "UnexpectedError" });
  });

  it("propagates the request's abort signal without treating interruption as a defect", async () => {
    const controller = new AbortController();
    const runtime = ManagedRuntime.make(Layer.empty);
    try {
      const pending = runHttp(
        Effect.never,
        runtime,
        new Request(request, { signal: controller.signal }),
      );
      controller.abort();
      const response = await pending;
      expect(response.status).toBe(499);
      expect(await response.json()).toEqual({ error: "RequestInterrupted" });
    } finally {
      await runtime.dispose();
    }
  });
});
