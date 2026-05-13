#!/usr/bin/env bash
# Restart Redis while APIs keep running — observe logs and /health redisConnected.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "[chaos] Restarting redis..."
docker compose restart redis

echo "[chaos] Done. Check API logs and: curl -s http://localhost/health | jq .redisConnected,.redisConfigured"
