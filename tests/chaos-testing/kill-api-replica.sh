#!/usr/bin/env bash
# Kill one API replica to simulate node loss (docker compose stack from repo root).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

TARGET="${1:-api_2}"

echo "[chaos] Killing compose service: ${TARGET}"
docker compose kill "${TARGET}"

echo "[chaos] Done. Surviving replicas + Redis should still relay global chat."
echo "[chaos] Restore: docker compose start ${TARGET}   (or: docker compose up -d ${TARGET})"
