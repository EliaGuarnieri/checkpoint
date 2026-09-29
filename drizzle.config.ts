import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { Effect, Redacted } from "effect";

import { MigrationUrl } from "./src/infrastructure/config";

loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infrastructure/database/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: Redacted.value(Effect.runSync(MigrationUrl)),
  },
});
