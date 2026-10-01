# Checkpoint implementation specification

Checkpoint is a single-user videogame journal built as a technical exercise centred on Effect v3.

## Product

- Track one personal library entry per catalog game.
- Library entries have a status (`backlog`, `playing`, `completed`, `abandoned`), an optional integer rating from 1 to 10, and one optional note.
- Search a catalog and add a game manually with `backlog` as its initial status.
- Filter the library by title, status, genre, developer, publisher, and minimum rating; sort by latest update, title, rating, or release date.
- View and edit a game on `/games/[id]`; browse on `/library`.
- The product has no authentication, users, social features, playtime tracking, background jobs, or automatic synchronization.

## Integrations and tests

- Provide live and deterministic fake Effect layers for RAWG catalog search.
- With the project-local PostgreSQL database, an absent or blank RAWG key selects the deterministic demo catalog with repository-local covers. A configured key selects RAWG, with no fallback on live errors. Supabase requires a RAWG key. Tests can provide the deterministic fake layer without credentials or network.
- Live credentials come only from environment variables and are never committed.
- Persist a local snapshot with full catalog metadata when a game is added to the library. Search does not write snapshots; loading details for an existing library game may refresh its snapshot.
- Display RAWG attribution in the application.

## Technical constraints

- Next.js 16, React 19, TypeScript, Effect v3, TanStack Query v5, Drizzle ORM 0.45, PostgreSQL in Docker locally or on Supabase, Vitest, shadcn/ui Base Nova, Tailwind CSS 4.
- Effect owns server configuration, dependencies, validation, errors, external requests, retry, concurrency, and repositories.
- TanStack Query owns browser queries, mutations, cache invalidation, and no server resilience policy.
- Drizzle is the only database abstraction; repository interfaces return Effect values.
- Validate untrusted route input, environment, and RAWG responses with Effect Schema.

## Delivery

- `pnpm setup`, `pnpm dev`, `pnpm test`, and `pnpm check` are documented and functional.
- Setup creates missing `.env` files with local defaults, recognizes only the project's local PostgreSQL target or Supabase, applies migrations and checks the library. Local setup starts Docker PostgreSQL and seeds an empty library atomically with all tracking statuses, ratings and notes; a nonempty library is preserved. The volume persists across container stops. Supabase setup never seeds demo data and retains its connection and project guards. See ADR 0002.
- `pnpm check` runs lint, typecheck, and unit tests.
- README explains local development, setup, live catalog key, architecture, Effect usage, trade-offs, tests, and AI assistance.
- README includes final screenshots of the library and game detail.
