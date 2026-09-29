#!/usr/bin/env bash
set -euo pipefail

test_database_url="postgres://checkpoint:checkpoint@localhost:5433/checkpoint_test"

docker compose rm --stop --force postgres-test
docker compose up -d --wait postgres-test
DATABASE_URL="$test_database_url" DATABASE_MIGRATION_URL="$test_database_url" ./node_modules/.bin/drizzle-kit migrate
DATABASE_URL="$test_database_url" ./node_modules/.bin/vitest run --config vitest.integration.config.ts
