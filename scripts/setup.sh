#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

docker compose up -d --wait postgres
local_database_url="postgres://checkpoint:checkpoint@localhost:5432/checkpoint"
DATABASE_URL="$local_database_url" DATABASE_MIGRATION_URL="$local_database_url" pnpm db:migrate
DATABASE_URL="$local_database_url" pnpm db:seed

echo "Checkpoint is ready. Run: pnpm dev"
