import { fileURLToPath } from "node:url";

import { Effect, Redacted } from "effect";
import { defineConfig } from "vitest/config";

import { DatabaseUrl } from "./src/infrastructure/config";

const testDatabaseUrl =
  "postgres://checkpoint:checkpoint@localhost:5433/checkpoint_test";

if (Redacted.value(Effect.runSync(DatabaseUrl)) !== testDatabaseUrl) {
  throw new Error(
    "Integration tests must use the dedicated local test database",
  );
}

export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
  },
});
