#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env. Add the Supabase connection URIs and RAWG_API_KEY, then run pnpm setup again."
  exit 1
fi

node --import tsx scripts/supabase-db.ts check

echo "Checkpoint is ready. Run: pnpm dev"
