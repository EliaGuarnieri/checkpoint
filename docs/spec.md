# Checkpoint implementation specification

Checkpoint is a single-user videogame journal built as a technical exercise centred on Effect v3.

## Product

- Track one personal library entry per catalog game.
- Library entries have a status (`backlog`, `playing`, `completed`, `abandoned`), an optional integer rating from 1 to 10, and one optional note.
- Search a catalog and add a game manually with `backlog` as its initial status.
- Filter the library by title, status, genre, developer, publisher, and minimum rating; sort by latest update, title, rating, or release date.
- View and edit a game on `/games/[id]`; browse on `/library`; import on `/import`.
- The product has no authentication, users, social features, playtime tracking, background jobs, or automatic synchronization.

## Steam import

- Limit one import to 100 games and reconcile at most four games concurrently.
- Prefer exact Steam App ID matches. A normalized-title match is only a candidate and requires explicit confirmation.
- Preview new, existing, candidate, and unmatched games before persisting.
- Confirmation adds only new games and accepted candidates.
- Reimports are idempotent and never overwrite personal status, rating, or note.
- A failure for one game must not discard successful results for other games.

## Integrations and demo

- Provide live and deterministic fake Effect layers for both RAWG and Steam.
- Demo mode is the default and requires no credentials or network. Steam ID `demo` exercises exact, existing, candidate, unmatched, and partial-failure cases.
- Live credentials come only from environment variables and are never committed.
- Persist a local snapshot of catalog metadata and refresh it when encountered by search or import.
- Display RAWG attribution on views that use live RAWG data, and `Demo catalog` in demo mode.

## Technical constraints

- Next.js 16, React 19, TypeScript, Effect v3, TanStack Query v5, Drizzle ORM 0.45, PostgreSQL in Docker, Vitest, shadcn/ui Base Nova, Tailwind CSS 4.
- Effect owns server configuration, dependencies, validation, errors, external requests, retry, concurrency, repositories, and import orchestration.
- TanStack Query owns browser queries, mutations, cache invalidation, and no server resilience policy.
- Drizzle is the only database abstraction; repository interfaces return Effect values.
- Validate untrusted route input, environment, Steam responses, and RAWG responses with Effect Schema.

## Delivery

- `pnpm setup`, `pnpm dev`, `pnpm test`, and `pnpm check` are documented and functional.
- Docker Compose starts PostgreSQL; migrations and deterministic seed data are included.
- CI runs lint, typecheck, and unit tests.
- README explains the problem, demo, setup, live API keys, architecture, Effect usage, trade-offs, tests, AI and skill usage, learning, and possible further investigation.
- README includes final screenshots of the library, game detail, and import preview.

