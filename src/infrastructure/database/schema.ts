import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const trackingStatus = pgEnum("tracking_status", [
  "backlog",
  "playing",
  "completed",
  "abandoned",
]);

export const companyRole = pgEnum("company_role", ["developer", "publisher"]);

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rawgId: integer("rawg_id").unique(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    coverUrl: text("cover_url"),
    releaseDate: date("release_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("games_slug_idx").on(table.slug)],
);

export const libraryEntries = pgTable(
  "library_entries",
  {
    gameId: uuid("game_id")
      .primaryKey()
      .references(() => games.id, { onDelete: "cascade" }),
    status: trackingStatus("status").notNull().default("backlog"),
    rating: integer("rating"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "library_entries_rating_range",
      sql`${table.rating} is null or (${table.rating} >= 1 and ${table.rating} <= 10)`,
    ),
  ],
);

export const genres = pgTable("genres", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const gameGenres = pgTable(
  "game_genres",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.gameId, table.genreId] })],
);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const gameCompanies = pgTable(
  "game_companies",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    role: companyRole("role").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.gameId, table.companyId, table.role] }),
  ],
);

export const ownershipSources = pgTable(
  "ownership_sources",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    externalId: text("external_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.gameId, table.provider] }),
    uniqueIndex("ownership_provider_external_idx").on(
      table.provider,
      table.externalId,
    ),
  ],
);
