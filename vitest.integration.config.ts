import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const testDatabaseUrl =
  "postgres://checkpoint:checkpoint@localhost:5433/checkpoint_test";

if (process.env.DATABASE_URL !== testDatabaseUrl) {
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
