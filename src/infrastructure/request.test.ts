import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "~/app/api/library/route";

afterEach(() => vi.unstubAllEnvs());

describe("JSON request boundary", () => {
  it("returns 400 for a malformed JSON body", async () => {
    vi.stubEnv("RAWG_API_KEY", "test-key");
    const response = await POST(
      new Request("http://checkpoint.test/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
  });
});
