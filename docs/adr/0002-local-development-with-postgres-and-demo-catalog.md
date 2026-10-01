# Credential-free local development with PostgreSQL and a demo catalog

Local development should let a contributor try Checkpoint without Supabase or RAWG credentials while exercising the PostgreSQL repository. Use a project-managed Docker PostgreSQL container and a deterministic demo catalog through the existing Effect service contracts; keep Supabase as the hosted database path.

`pnpm setup` creates `.env` with local defaults when it is missing. It recognizes the project's local database by its local host, configured port and database name, starts the Docker container, waits for readiness, applies migrations and seeds demo data only when the library is empty. Existing environment files and nonempty libraries are preserved. Other PostgreSQL targets are rejected by setup rather than treated as the project's container.

For Supabase, setup applies migrations and verifies the connection using the existing dedicated connection checks. It never automatically seeds demo data, and RAWG credentials remain required.

With the project's local database, a missing or blank RAWG key selects the demo catalog; a configured key selects RAWG. RAWG failures remain visible and do not trigger a fallback to demo data. The demo dataset includes repository-local covers, library entries spanning all tracking statuses with examples of ratings and notes, and at least one catalog game absent from the initial library. Every seeded game must be available in the demo catalog so metadata refresh works without network access.

Docker is a local prerequisite. Setup reports a missing installation, unavailable daemon or occupied container port clearly. The container remains running after setup and stores data in a persistent volume. A reset command is outside this change's scope.

This replaces the Supabase-only development and live-only application catalog requirements in `docs/spec.md` and `PRODUCT.md`. Database persistence remains the same live PostgreSQL adapter in both environments, while Effect `Layer` composition supplies the selected catalog implementation.
