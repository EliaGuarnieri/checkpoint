# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a player keeping a personal videogame journal. The project also serves its maintainer as a way to learn Effect. When those purposes compete, the player experience guides product decisions.

## Product Purpose

Checkpoint lets a player find a game, add one personal library entry for it, and record a tracking status, optional rating, and optional note. It keeps that personal record separate from the store or platform where the game is owned.

## Positioning

Checkpoint centers on the player's own record for each game, without store imports, ownership tracking, social features, or playtime tracking. Its implementation is also an Effect v3 learning exercise, with explicit dependencies, validation, and errors at server boundaries.

## Operating Context

The player searches the RAWG catalog, manually adds a game to the library, browses and filters the library, and edits the entry on a game detail page. Catalog search can refresh a local game metadata snapshot; only an explicit add action creates a personal library entry. The current interface and README use Italian copy.

## Capabilities and Constraints

- One library entry per catalog game. A new entry starts in `backlog`.
- Tracking statuses are `backlog`, `playing`, `completed`, and `abandoned`. `completed` means the player considers the game concluded, not necessarily fully completed.
- A rating is an optional whole number from 1 to 10. A note is one optional piece of personal text. Both are independent of tracking status.
- The library supports filters for title, status, genre, developer, publisher, and minimum rating, plus sorting by latest update, title, rating, or release date.
- The product is single-user and has no authentication, social features, playtime tracking, background jobs, or automatic synchronization.
- Local development uses the project-managed Docker PostgreSQL database and a deterministic demo catalog when the RAWG key is absent or blank. Demo covers are included in the repository. A configured key selects the live catalog; Supabase requires a RAWG key. Live failures do not switch to the demo catalog. Tests can use a deterministic fake catalog without credentials or network access.
- The web app uses Next.js, React, TypeScript, Effect v3, TanStack Query, Drizzle ORM, and PostgreSQL. Effect owns server configuration, dependencies, validation, typed errors, external requests, retry, concurrency, and repository interfaces. TanStack Query owns browser queries, mutations, and cache invalidation.
- Domain terms are defined in [CONTEXT.md](CONTEXT.md): game, library entry, tracking status, rating, note, and catalog.

## Brand Commitments

The product name is Checkpoint. Existing product copy is in Italian.

## Evidence on Hand

- Product specification: [docs/spec.md](docs/spec.md).
- Domain vocabulary: [CONTEXT.md](CONTEXT.md).
- Existing interface screenshots: [docs/screenshots/library.png](docs/screenshots/library.png) and [docs/screenshots/game-detail.png](docs/screenshots/game-detail.png).
- Local setup, architecture, and Effect usage: [README.md](README.md).
- No testimonials, customer claims, or usage benchmarks are documented in the repository.

## Product Principles

1. Make the player's personal game record easy to find and update.
2. Keep catalog metadata distinct from the player's library entry.
3. Require an explicit player action to add a game; catalog search alone does not change the personal library.
4. Keep the product small enough that Effect concepts remain clear and teachable in the implementation.
