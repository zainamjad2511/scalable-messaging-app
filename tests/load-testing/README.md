# Load testing (Phase 3 — Step 7)

## Prerequisites

- **k6** installed: [https://grafana.com/docs/k6/latest/set-up/install-k6/](https://grafana.com/docs/k6/latest/set-up/install-k6/)
- Stack running with a working **Supabase**-backed API (join calls `get_or_create_user`).
- WebSocket entrypoint (default **`ws://localhost`** — Nginx on port 80).

## Script

[`k6-ws-chat.js`](./k6-ws-chat.js) opens many virtual users, each sends `join` with a unique username, waits for a `welcome` payload, then closes.

### Run

From the repository root:

```bash
export WS_URL="${WS_URL:-ws://localhost/}"
k6 run tests/load-testing/k6-ws-chat.js
```

Against a **direct** local API (no Nginx):

```bash
WS_URL=ws://localhost:4000/ k6 run tests/load-testing/k6-ws-chat.js
```

## Pass / fail

- [ ] **PASS:** `checks` success rate is **≥ 99%** (see k6 summary output: `checks.........................: 99.xx%`).
- [ ] **PASS:** No sustained `ws_errors` growth (open handler errors).
- [ ] **FAIL / investigate:** Supabase rate limits or auth errors — reduce `vus` / `duration` in `options` inside `k6-ws-chat.js`.

## Interpretation

This is a **smoke / soak** scenario, not a formal benchmark. Tune `vus` and `duration` to match your environment and course evaluation limits.
