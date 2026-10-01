import { eq, inArray, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { DatabaseUrl } from "~/infrastructure/config";
import { getDatabase, type Database } from "~/infrastructure/database/client";
import {
  companies,
  gameCompanies,
  gameGenres,
  games,
  genres,
  libraryEntries,
} from "~/infrastructure/database/schema";
import type { CatalogGame } from "~/modules/catalog/model";
import { demoCatalogGames } from "~/modules/catalog/demo-data";
import type { LibraryFilters, LibraryGame } from "~/modules/library/model";
import { filterLibraryGames } from "~/modules/library/query";
import {
  DatabaseUnavailable,
  LibraryEntryNotFound,
  LibraryRepository,
  LibraryOperation,
} from "~/modules/library/service";

const databaseEffect = <A>(
  operation: LibraryOperation,
  run: (db: Database) => Promise<A>,
) =>
  Effect.gen(function* () {
    const databaseUrl = yield* DatabaseUrl.pipe(
      Effect.mapError((cause) => new DatabaseUnavailable({ operation, cause })),
    );
    return yield* Effect.tryPromise({
      try: () => run(getDatabase(databaseUrl)),
      catch: (cause) => new DatabaseUnavailable({ operation, cause }),
    });
  });

type DatabaseTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

const syncGameMetadata = async (
  transaction: DatabaseTransaction,
  gameId: string,
  game: CatalogGame,
) => {
  await transaction.delete(gameGenres).where(eq(gameGenres.gameId, gameId));
  await transaction
    .delete(gameCompanies)
    .where(eq(gameCompanies.gameId, gameId));

  for (const name of game.genres) {
    const [genre] = await transaction
      .insert(genres)
      .values({ name })
      .onConflictDoUpdate({ target: genres.name, set: { name } })
      .returning({ id: genres.id });
    if (genre) {
      await transaction
        .insert(gameGenres)
        .values({ gameId, genreId: genre.id })
        .onConflictDoNothing();
    }
  }

  for (const [role, names] of [
    ["developer", game.developers],
    ["publisher", game.publishers],
  ] as const) {
    for (const name of names) {
      const [company] = await transaction
        .insert(companies)
        .values({ name })
        .onConflictDoUpdate({ target: companies.name, set: { name } })
        .returning({ id: companies.id });
      if (company) {
        await transaction
          .insert(gameCompanies)
          .values({ gameId, companyId: company.id, role })
          .onConflictDoNothing();
      }
    }
  }
};

const upsertCatalogGame = async (
  transaction: DatabaseTransaction,
  game: CatalogGame,
) => {
  const rawgId = Number(game.id);
  const [stored] = await transaction
    .insert(games)
    .values({
      rawgId: Number.isFinite(rawgId) ? rawgId : null,
      title: game.title,
      slug: game.slug,
      coverUrl: game.coverUrl,
      releaseDate: game.releaseDate,
    })
    .onConflictDoUpdate({
      target: games.slug,
      set: {
        ...(Number.isFinite(rawgId) ? { rawgId } : {}),
        title: game.title,
        coverUrl: game.coverUrl,
        releaseDate: game.releaseDate,
        updatedAt: new Date(),
      },
    })
    .returning({ id: games.id });

  if (!stored) throw new Error("Game upsert returned no row");
  await syncGameMetadata(transaction, stored.id, game);
  return stored.id;
};

const loadLibraryGames = async (
  db: Database,
  gameId?: string,
): Promise<Array<LibraryGame>> => {
  const rows = await db
    .select({
      id: games.id,
      rawgId: games.rawgId,
      title: games.title,
      slug: games.slug,
      coverUrl: games.coverUrl,
      releaseDate: games.releaseDate,
      status: libraryEntries.status,
      rating: libraryEntries.rating,
      note: libraryEntries.note,
      updatedAt: libraryEntries.updatedAt,
    })
    .from(libraryEntries)
    .innerJoin(games, eq(libraryEntries.gameId, games.id))
    .where(gameId ? eq(games.id, gameId) : undefined);

  if (rows.length === 0) return [];
  const gameIds = rows.map(({ id }) => id);

  const [genreRows, companyRows] = await Promise.all([
    db
      .select({ gameId: gameGenres.gameId, name: genres.name })
      .from(gameGenres)
      .innerJoin(genres, eq(gameGenres.genreId, genres.id))
      .where(inArray(gameGenres.gameId, gameIds)),
    db
      .select({
        gameId: gameCompanies.gameId,
        name: companies.name,
        role: gameCompanies.role,
      })
      .from(gameCompanies)
      .innerJoin(companies, eq(gameCompanies.companyId, companies.id))
      .where(inArray(gameCompanies.gameId, gameIds)),
  ]);

  const genresByGame = new Map<string, Array<string>>();
  for (const { gameId: id, name } of genreRows) {
    const names = genresByGame.get(id) ?? [];
    names.push(name);
    genresByGame.set(id, names);
  }
  const companiesByGame = new Map<
    string,
    { developers: Array<string>; publishers: Array<string> }
  >();
  for (const { gameId: id, name, role } of companyRows) {
    const names = companiesByGame.get(id) ?? { developers: [], publishers: [] };
    names[role === "developer" ? "developers" : "publishers"].push(name);
    companiesByGame.set(id, names);
  }

  return rows.map((row) => ({
    ...row,
    updatedAt: row.updatedAt.toISOString(),
    genres: genresByGame.get(row.id) ?? [],
    developers: companiesByGame.get(row.id)?.developers ?? [],
    publishers: companiesByGame.get(row.id)?.publishers ?? [],
  }));
};

export const LibraryRepositoryLive = Layer.succeed(LibraryRepository, {
  list: (filters: LibraryFilters = {}) =>
    databaseEffect("listLibrary", async (db) => {
      const games = await loadLibraryGames(db);
      return filterLibraryGames(games, filters);
    }),
  findById: (gameId) =>
    databaseEffect("findLibraryEntry", (db) =>
      loadLibraryGames(db, gameId),
    ).pipe(
      Effect.flatMap(([game]) =>
        game
          ? Effect.succeed(game)
          : Effect.fail(new LibraryEntryNotFound({ gameId })),
      ),
    ),
  addManualGame: (game) =>
    databaseEffect("addManualGame", (db) =>
      db.transaction(async (transaction) => {
        const rawgId = Number(game.id);
        const [existing] = await transaction
          .select({ id: games.id })
          .from(libraryEntries)
          .innerJoin(games, eq(libraryEntries.gameId, games.id))
          .where(
            Number.isFinite(rawgId)
              ? eq(games.rawgId, rawgId)
              : eq(games.slug, game.slug),
          )
          .limit(1);
        if (existing) return existing.id;

        const gameId = await upsertCatalogGame(transaction, game);
        await transaction
          .insert(libraryEntries)
          .values({ gameId, status: "backlog" })
          .onConflictDoNothing();
        return gameId;
      }),
    ),
  refreshCatalogGame: (gameId, game) =>
    databaseEffect("refreshCatalogGame", (db) =>
      db.transaction(async (transaction) => {
        const [entry] = await transaction
          .select({ gameId: libraryEntries.gameId })
          .from(libraryEntries)
          .where(eq(libraryEntries.gameId, gameId))
          .limit(1);
        if (!entry) return false;

        await transaction
          .update(games)
          .set({
            title: game.title,
            slug: game.slug,
            coverUrl: game.coverUrl,
            releaseDate: game.releaseDate,
            updatedAt: new Date(),
          })
          .where(eq(games.id, gameId));
        await syncGameMetadata(transaction, gameId, game);
        return true;
      }),
    ).pipe(
      Effect.flatMap((refreshed) =>
        refreshed
          ? Effect.void
          : Effect.fail(new LibraryEntryNotFound({ gameId })),
      ),
    ),
  update: (gameId, update) =>
    databaseEffect("updateLibraryEntry", (db) =>
      db
        .update(libraryEntries)
        .set({ ...update, updatedAt: new Date() })
        .where(eq(libraryEntries.gameId, gameId))
        .returning({ gameId: libraryEntries.gameId }),
    ).pipe(
      Effect.flatMap((rows) =>
        rows.length > 0
          ? Effect.void
          : Effect.fail(new LibraryEntryNotFound({ gameId })),
      ),
    ),
  remove: (gameId) =>
    databaseEffect("removeLibraryEntry", (db) =>
      db
        .delete(libraryEntries)
        .where(eq(libraryEntries.gameId, gameId))
        .returning({ gameId: libraryEntries.gameId }),
    ).pipe(
      Effect.flatMap((rows) =>
        rows.length > 0
          ? Effect.void
          : Effect.fail(new LibraryEntryNotFound({ gameId })),
      ),
    ),
});

// One SQL transaction prevents a failed or concurrent setup from leaving a partial seed.
export const seedDemoLibrary = databaseEffect("addManualGame", (db) =>
  db.transaction(async (transaction) => {
    await transaction.execute(
      sql`LOCK TABLE library_entries IN SHARE ROW EXCLUSIVE MODE`,
    );
    const existing = await transaction.select().from(libraryEntries).limit(1);
    if (existing.length > 0) return false;

    const demoEntries = [
      {
        catalogId: "274755",
        status: "completed",
        rating: 9,
        note: "Una run dopo l'altra, c'è sempre qualcosa da scoprire.",
      },
      { catalogId: "22121", status: "backlog", rating: null, note: null },
      {
        catalogId: "3328",
        status: "playing",
        rating: 8,
        note: "Riprendere la questline delle Skellige.",
      },
      {
        catalogId: "9767",
        status: "abandoned",
        rating: 7,
        note: "Riprenderlo quando avrò voglia di una nuova sfida.",
      },
    ] satisfies ReadonlyArray<
      { catalogId: string } & Required<
        import("~/modules/library/model").LibraryEntryUpdate
      >
    >;

    for (const entry of demoEntries) {
      const game = demoCatalogGames.find(({ id }) => id === entry.catalogId);
      if (!game) throw new Error("Demo library entry has no catalog game");
      const gameId = await upsertCatalogGame(transaction, game);
      await transaction.insert(libraryEntries).values({
        gameId,
        status: entry.status,
        rating: entry.rating,
        note: entry.note,
      });
    }
    return true;
  }),
);
