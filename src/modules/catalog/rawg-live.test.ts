import {
  Cause,
  Effect,
  Exit,
  Fiber,
  Redacted,
  TestClock,
  TestContext,
} from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeGameCatalogLive } from "./rawg-live";
import { GameCatalog } from "./service";

const layer = makeGameCatalogLive(Redacted.make("private-test-key"));
const search = Effect.gen(function* () {
  const catalog = yield* GameCatalog;
  return yield* catalog.searchByTitle("Hades");
}).pipe(Effect.provide(layer));
const successfulResponse = () =>
  Response.json({
    results: [
      {
        id: 3498,
        name: "Hades",
        slug: "hades",
        background_image: null,
        released: null,
        genres: [],
      },
    ],
  });
afterEach(() => vi.unstubAllGlobals());

describe("RAWG resilience", () => {
  it("retries a network failure after headers have arrived", async () => {
    const fetch = vi.fn(async () => {
      if (fetch.mock.calls.length > 1) return successfulResponse();
      return new Response(
        new ReadableStream({
          start(stream) {
            stream.error(
              new TypeError("terminated", { cause: { code: "ECONNRESET" } }),
            );
          },
        }),
      );
    });
    vi.stubGlobal("fetch", fetch);
    const result = await Effect.runPromise(search);
    expect(result[0]?.title).toBe("Hades");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it.each([400, 401, 403, 404])(
    "does not retry a permanent HTTP %s",
    async (status) => {
      const fetch = vi.fn(async () => new Response(null, { status }));
      vi.stubGlobal("fetch", fetch);
      const error = await Effect.runPromise(search.pipe(Effect.flip));
      expect(error).toMatchObject({ _tag: "CatalogHttpError", status });
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );

  it("retries transient HTTP failures with a bounded number of attempts", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetch);
    const error = await Effect.runPromise(search.pipe(Effect.flip));
    expect(error).toMatchObject({ _tag: "CatalogHttpError", status: 503 });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("does not retry invalid JSON or invalid catalog data", async () => {
    const fetch = vi.fn(async () => new Response("invalid JSON"));
    vi.stubGlobal("fetch", fetch);
    expect(await Effect.runPromise(search.pipe(Effect.flip))).toMatchObject({
      _tag: "CatalogResponseInvalid",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    fetch.mockImplementation(async () =>
      Response.json({ results: [{ id: "wrong" }] }),
    );
    expect(await Effect.runPromise(search.pipe(Effect.flip))).toMatchObject({
      _tag: "CatalogResponseInvalid",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("honors Retry-After before retrying HTTP 429", async () => {
    let started!: () => void;
    const firstRequest = new Promise<void>((resolve) => {
      started = resolve;
    });
    const fetch = vi.fn(async () => {
      started();
      return fetch.mock.calls.length === 1
        ? new Response(null, { status: 429, headers: { "Retry-After": "2" } })
        : successfulResponse();
    });
    vi.stubGlobal("fetch", fetch);
    const program = Effect.gen(function* () {
      const fiber = yield* Effect.fork(search);
      yield* Effect.promise(() => firstRequest);
      yield* TestClock.adjust("1 second");
      expect(fetch).toHaveBeenCalledTimes(1);
      yield* TestClock.adjust("1 second");
      return yield* Fiber.join(fiber);
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(TestContext.TestContext)),
    );
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result[0]?.title).toBe("Hades");
  });

  it("times out the whole operation and aborts outstanding fetches", async () => {
    const signals: Array<AbortSignal> = [];
    let started!: () => void;
    const firstRequest = new Promise<void>((resolve) => {
      started = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) => {
        signals.push(init.signal!);
        started();
        return new Promise<Response>((_resolve, reject) => {
          init.signal!.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
        });
      }),
    );
    const program = Effect.gen(function* () {
      const fiber = yield* Effect.fork(search);
      yield* Effect.promise(() => firstRequest);
      yield* TestClock.adjust("10 seconds");
      return yield* Fiber.await(fiber);
    });
    const exit = await Effect.runPromise(
      program.pipe(Effect.provide(TestContext.TestContext)),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit))
      expect(Cause.pretty(exit.cause)).toContain("CatalogTimeout");
    expect(signals).toHaveLength(3);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it("aborts a response while JSON is still being read", async () => {
    const controller = new AbortController();
    let reading!: () => void;
    const bodyRead = new Promise<void>((resolve) => {
      reading = resolve;
    });
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        signal = init.signal!;
        const response = new Response(
          new ReadableStream({
            start(stream) {
              stream.enqueue(new TextEncoder().encode('{"results":['));
              signal!.addEventListener(
                "abort",
                () => stream.error(new Error("aborted")),
                { once: true },
              );
            },
          }),
        );
        const json = response.json.bind(response);
        response.json = () => {
          reading();
          return json();
        };
        return response;
      }),
    );
    const pending = Effect.runPromiseExit(search, {
      signal: controller.signal,
    });
    await bodyRead;
    controller.abort();
    const exit = await pending;
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit))
      expect(Cause.isInterruptedOnly(exit.cause)).toBe(true);
    expect(signal?.aborted).toBe(true);
  });
});
