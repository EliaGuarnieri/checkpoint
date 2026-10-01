#!/usr/bin/env bash
set -euo pipefail

node --import tsx scripts/db.ts setup
