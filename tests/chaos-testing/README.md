# Chaos testing (Phase 3 — Step 7)

Executable scripts assume **`docker compose` from the repository root** with the default `docker-compose.yml` (Nginx + `api_1`–`api_3` + Redis).

## Scripts

| Script | Action |
|--------|--------|
| [`kill-api-replica.sh`](./kill-api-replica.sh) | Sends `SIGKILL` to one API container (default `api_2`). |
| [`restart-redis.sh`](./restart-redis.sh) | Restarts the `redis` service. |

Run from anywhere:

```bash
./tests/chaos-testing/kill-api-replica.sh
./tests/chaos-testing/restart-redis.sh
```

## Pass / fail checklist

Complete with two browser sessions (or one browser + incognito), app pointed at **`NEXT_PUBLIC_WS_URL=ws://localhost`** (Nginx on port 80), Supabase configured in `apps/api/.env`.

### Replica loss

- [ ] **PASS:** With stack up, both clients receive each other’s **global** messages.
- [ ] **PASS:** After `./tests/chaos-testing/kill-api-replica.sh`, clients still connected to *other* replicas continue chatting; new global messages still cross between users on surviving nodes (Redis relay).
- [ ] **PASS:** After `docker compose start api_2` (or `docker compose up -d api_2`), the replica returns; new connections can succeed.

### Redis restart

- [ ] **PASS:** `redisConnected` is `true` in `GET /health` through Nginx while Redis is healthy (`curl -s http://localhost/health | jq .`).
- [ ] **PASS:** After `./tests/chaos-testing/restart-redis.sh`, API logs show Redis client errors and/or reconnect attempts; **document observed behavior** (ioredis may reconnect; if a process exits, note it for the report).

### Notes

- Redis Pub/Sub is not durable; chaos tests focus on **live** delivery and **availability**, not guaranteed history replay.
- WS connections are pinned to one API instance; killing the instance drops only clients attached to that upstream, not the whole cluster.
