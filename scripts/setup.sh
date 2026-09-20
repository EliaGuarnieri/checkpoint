#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

docker compose up -d --wait postgres
pnpm db:migrate
pnpm db:seed

echo "Checkpoint is ready. Run: pnpm dev"
