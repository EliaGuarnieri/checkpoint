import { describe, expect, it } from "vitest";

import { POST } from "~/app/api/import/preview/route";

describe("JSON request boundary", () => {
  it("returns 400 for a malformed JSON body", async () => {
    const response = await POST(
      new Request("http://checkpoint.test/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
  });
});
