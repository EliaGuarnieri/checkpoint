import { db } from "../src/infrastructure/database/client";
import {
  companies,
  gameCompanies,
  gameGenres,
  games,
  genres,
  libraryEntries,
  ownershipSources,
} from "../src/infrastructure/database/schema";

const seedGames = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    rawgId: 3498,
    title: "Hades",
    slug: "hades",
    releaseDate: "2020-09-17",
    status: "completed" as const,
    rating: 9,
    note: "Combat fluidissimo e una struttura narrativa che rende ogni run significativa.",
    genres: ["Action", "Roguelike"],
    developer: "Supergiant Games",
    publisher: "Supergiant Games",
    steamAppId: "1145360",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    rawgId: 3328,
    title: "The Witcher 3: Wild Hunt",
    slug: "the-witcher-3-wild-hunt",
    releaseDate: "2015-05-18",
    status: "playing" as const,
    rating: 8,
    note: "Riprendere la questline delle Skellige.",
    genres: ["RPG"],
    developer: "CD Projekt RED",
    publisher: "CD Projekt",
    steamAppId: "292030",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    rawgId: 28,
    title: "Red Dead Redemption 2",
    slug: "red-dead-redemption-2",
    releaseDate: "2018-10-26",
    status: "backlog" as const,
    rating: null,
    note: null,
    genres: ["Action", "Adventure"],
    developer: "Rockstar Games",
    publisher: "Rockstar Games",
    steamAppId: "1174180",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    rawgId: 9767,
    title: "Hollow Knight",
    slug: "hollow-knight",
    releaseDate: "2017-02-24",
    status: "abandoned" as const,
    rating: 7,
    note: "Bellissimo, ma al momento non ho voglia di tornare sulle sezioni più punitive.",
    genres: ["Action", "Platformer"],
    developer: "Team Cherry",
    publisher: "Team Cherry",
    steamAppId: "367520",
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    rawgId: 3790,
    title: "Stardew Valley",
    slug: "stardew-valley",
    releaseDate: "2016-02-26",
    status: "completed" as const,
    rating: 10,
    note: "La fattoria a cui torno quando voglio rallentare.",
    genres: ["RPG", "Simulation"],
    developer: "ConcernedApe",
    publisher: "ConcernedApe",
    steamAppId: "413150",
  },
];

for (const game of seedGames) {
  await db
    .insert(games)
    .values({
      id: game.id,
      rawgId: game.rawgId,
      title: game.title,
      slug: game.slug,
      releaseDate: game.releaseDate,
    })
    .onConflictDoNothing();
  await db
    .insert(libraryEntries)
    .values({
      gameId: game.id,
      status: game.status,
      rating: game.rating,
      note: game.note,
    })
    .onConflictDoNothing();
  await db
    .insert(ownershipSources)
    .values({ gameId: game.id, provider: "steam", externalId: game.steamAppId })
    .onConflictDoNothing();

  for (const name of game.genres) {
    const [genre] = await db
      .insert(genres)
      .values({ name })
      .onConflictDoUpdate({ target: genres.name, set: { name } })
      .returning({ id: genres.id });
    if (genre) {
      await db
        .insert(gameGenres)
        .values({ gameId: game.id, genreId: genre.id })
        .onConflictDoNothing();
    }
  }

  for (const [role, name] of [
    ["developer", game.developer],
    ["publisher", game.publisher],
  ] as const) {
    const [company] = await db
      .insert(companies)
      .values({ name })
      .onConflictDoUpdate({ target: companies.name, set: { name } })
      .returning({ id: companies.id });
    if (company) {
      await db
        .insert(gameCompanies)
        .values({ gameId: game.id, companyId: company.id, role })
        .onConflictDoNothing();
    }
  }
}

console.log(`Seeded ${seedGames.length} library entries.`);
