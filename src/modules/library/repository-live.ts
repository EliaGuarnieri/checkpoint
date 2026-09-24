import { and, asc, desc, eq, gte, ilike } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { db } from "~/infrastructure/database/client";
import {
  companies,
  gameCompanies,
  gameGenres,
  games,
  genres,
  libraryEntries,
  ownershipSources,
} from "~/infrastructure/database/schema";
import type { CatalogGame } from "~/modules/catalog/model";
import type { LibraryFilters, LibraryGame } from "~/modules/library/model";
import {
  DatabaseUnavailable,
  LibraryEntryNotFound,
  LibraryRepository,
  LibraryOperation,
} from "~/modules/library/service";

const databaseEffect = <A>(
  operation: LibraryOperation,
  run: () => Promise<A>,
) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new DatabaseUnavailable({ operation, cause }),
  });

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

const upsertCatalogGame = (game: CatalogGame) =>
  db.transaction(async (transaction) => {
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
  });

const loadLibraryGame = async (gameId: string): Promise<LibraryGame | null> => {
  const [row] = await db
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
    .where(eq(games.id, gameId));

  if (!row) return null;

  const genreRows = await db
    .select({ name: genres.name })
    .from(gameGenres)
    .innerJoin(genres, eq(gameGenres.genreId, genres.id))
    .where(eq(gameGenres.gameId, gameId));
  const companyRows = await db
    .select({ name: companies.name, role: gameCompanies.role })
    .from(gameCompanies)
    .innerJoin(companies, eq(gameCompanies.companyId, companies.id))
    .where(eq(gameCompanies.gameId, gameId));

  return {
    ...row,
    updatedAt: row.updatedAt.toISOString(),
    genres: genreRows.map(({ name }) => name),
    developers: companyRows
      .filter(({ role }) => role === "developer")
      .map(({ name }) => name),
    publishers: companyRows
      .filter(({ role }) => role === "publisher")
      .map(({ name }) => name),
  };
};

export const LibraryRepositoryLive = Layer.succeed(LibraryRepository, {
  refreshCatalogGames: (catalogGames) =>
    databaseEffect("refreshCatalogGames", async () => {
      for (const game of catalogGames) await upsertCatalogGame(game);
    }),
  containsCatalogGame: (catalogGameId) =>
    databaseEffect("containsCatalogGame", async () => {
      const rawgId = Number(catalogGameId);
      const result = await db
        .select({ id: games.id })
        .from(libraryEntries)
        .innerJoin(games, eq(libraryEntries.gameId, games.id))
        .where(eq(games.rawgId, rawgId))
        .limit(1);
      return result.length > 0;
    }),
  list: (filters: LibraryFilters = {}) =>
    databaseEffect("listLibrary", async () => {
      const conditions = [
        filters.query ? ilike(games.title, `%${filters.query}%`) : undefined,
        filters.status ? eq(libraryEntries.status, filters.status) : undefined,
        filters.minimumRating
          ? gte(libraryEntries.rating, filters.minimumRating)
          : undefined,
      ].filter((condition) => condition !== undefined);
      const order =
        filters.sort === "title"
          ? asc(games.title)
          : filters.sort === "rating"
            ? desc(libraryEntries.rating)
            : filters.sort === "releaseDate"
              ? desc(games.releaseDate)
              : desc(libraryEntries.updatedAt);
      const rows = await db
        .select({ id: games.id })
        .from(libraryEntries)
        .innerJoin(games, eq(libraryEntries.gameId, games.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(order);
      const loaded = await Promise.all(
        rows.map(({ id }) => loadLibraryGame(id)),
      );
      return loaded.filter((game): game is LibraryGame => {
        if (!game) return false;
        if (filters.genre && !game.genres.includes(filters.genre)) return false;
        if (filters.developer && !game.developers.includes(filters.developer))
          return false;
        if (filters.publisher && !game.publishers.includes(filters.publisher))
          return false;
        return true;
      });
    }),
  findById: (gameId) =>
    databaseEffect("findLibraryEntry", () => loadLibraryGame(gameId)).pipe(
      Effect.flatMap((game) =>
        game
          ? Effect.succeed(game)
          : Effect.fail(new LibraryEntryNotFound({ gameId })),
      ),
    ),
  importGame: (game, steamAppId) =>
    databaseEffect("importGame", async () => {
      const gameId = await upsertCatalogGame(game);
      await db
        .insert(libraryEntries)
        .values({ gameId, status: "backlog" })
        .onConflictDoNothing();
      await db
        .insert(ownershipSources)
        .values({ gameId, provider: "steam", externalId: steamAppId })
        .onConflictDoNothing();
    }),
  addManualGame: (game) =>
    databaseEffect("addManualGame", async () => {
      const gameId = await upsertCatalogGame(game);
      await db
        .insert(libraryEntries)
        .values({ gameId, status: "backlog" })
        .onConflictDoNothing();
    }),
  update: (gameId, update) =>
    databaseEffect("updateLibraryEntry", () =>
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
    databaseEffect("removeLibraryEntry", () =>
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
