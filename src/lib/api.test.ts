import { Schema } from "effect";
import { afterEach, expect, it, vi } from "vitest";

import { fetchJson } from "./api";

afterEach(() => vi.unstubAllGlobals());
it("forwards cancellation to fetch while decoding successful responses", async () => {
  const controller = new AbortController();
  const fetch = vi.fn(async () => Response.json({ value: "ok" }));
  vi.stubGlobal("fetch", fetch);
  const value = await fetchJson(
    Schema.Struct({ value: Schema.String }),
    "/api/library",
    { signal: controller.signal },
  );
  expect(value).toEqual({ value: "ok" });
  expect(fetch).toHaveBeenCalledWith("/api/library", {
    signal: controller.signal,
  });
});
