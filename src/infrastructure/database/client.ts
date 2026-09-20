import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "~/infrastructure/database/schema";

const configuredUrl = process.env.DATABASE_URL;
const connectionString =
  configuredUrl && configuredUrl !== "memory"
    ? configuredUrl
    : "postgres://checkpoint:checkpoint@localhost:5432/checkpoint";

const client = postgres(connectionString, { max: 10 });

export const db = drizzle(client, { schema });
