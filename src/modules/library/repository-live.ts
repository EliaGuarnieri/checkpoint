import { eq, inArray } from "drizzle-orm";
import { Clock, Data, Effect, Layer, Schema } from "effect";

import {
  Database,
  type DatabaseClient,
} from "~/infrastructure/database/client";
import { databaseFailure } from "~/infrastructure/database/errors";
import {
  companies,
  gameCompanies,
  gameGenres,
  games,
  genres,
  libraryEntries,
} from "~/infrastructure/database/schema";
import type { CatalogGame } from "~/modules/catalog/model";
import {
  LibraryGameSchema,
  type LibraryFilters,
  type LibraryGame,
} from "~/modules/library/model";
import { filterLibraryGames } from "~/modules/library/query";
import {
  LibraryEntryNotFound,
  LibraryRepository,
  LibraryOperation,
} from "~/modules/library/service";

class DatabaseDriverFailure extends Data.TaggedError("DatabaseDriverFailure")<{
  readonly cause: unknown;
}> {}

const databaseEffect = <A>(
  db: DatabaseClient,
  operation: LibraryOperation,
  run: (db: DatabaseClient, now: Date) => Promise<A>,
) =>
  Effect.gen(function* () {
    const timestamp = yield* Clock.currentTimeMillis;
    return yield* Effect.tryPromise({
      try: () => run(db, new Date(timestamp)),
      catch: (cause) => new DatabaseDriverFailure({ cause }),
    }).pipe(
      Effect.catchAll((error) => databaseFailure(operation, error.cause)),
      Effect.withSpan(`library.database.${operation}`),
    );
  });

type DatabaseTransaction = Parameters<
  Parameters<DatabaseClient["transaction"]>[0]
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
  now: Date,
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
        updatedAt: now,
      },
    })
    .returning({ id: games.id });

  if (!stored) throw new Error("Game upsert returned no row");
  await syncGameMetadata(transaction, stored.id, game);
  return stored.id;
};

const loadLibraryGames = async (
  db: DatabaseClient,
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

export const LibraryRepositoryLive = Layer.effect(
  LibraryRepository,
  Effect.gen(function* () {
    const client = yield* Database;
    return {
      list: (filters: LibraryFilters = {}) =>
        databaseEffect(client, "listLibrary", (db) =>
          loadLibraryGames(db),
        ).pipe(
          Effect.flatMap((rows) =>
            Schema.decodeUnknown(Schema.Array(LibraryGameSchema))(rows).pipe(
              Effect.orDie,
            ),
          ),
          Effect.map((games) => filterLibraryGames(games, filters)),
        ),
      findById: (gameId) =>
        databaseEffect(client, "findLibraryEntry", (db) =>
          loadLibraryGames(db, gameId),
        ).pipe(
          Effect.flatMap(([game]) =>
            game
              ? Schema.decodeUnknown(LibraryGameSchema)(game).pipe(Effect.orDie)
              : Effect.fail(new LibraryEntryNotFound({ gameId })),
          ),
        ),
      addManualGame: (game) =>
        databaseEffect(client, "addManualGame", (db, now) =>
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

            const gameId = await upsertCatalogGame(transaction, game, now);
            await transaction
              .insert(libraryEntries)
              .values({ gameId, status: "backlog" })
              .onConflictDoNothing();
            return gameId;
          }),
        ),
      refreshCatalogGame: (gameId, game) =>
        databaseEffect(client, "refreshCatalogGame", (db, now) =>
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
                updatedAt: now,
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
        databaseEffect(client, "updateLibraryEntry", (db, now) =>
          db
            .update(libraryEntries)
            .set({ ...update, updatedAt: now })
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
        databaseEffect(client, "removeLibraryEntry", (db) =>
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
    };
  }),
);
