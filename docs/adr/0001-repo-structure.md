# ADR-0001: Repository structure

**Status:** Accepted  
**Date:** 2026-04-01

## Context

This project will evolve from a baseline monolith into a distributed system:

- Next.js/React frontend
- Node.js API + WebSockets (scaled horizontally)
- Nginx load balancer
- Redis Pub/Sub
- Postgres via Supabase

## Decision

Adopt a monorepo-style structure:

- `apps/` for deployable applications (`web`, `api`)
- `packages/` for shared code (types, utilities)
- `infra/` for deployment/runtime configuration (nginx, redis, docker, supabase)
- `docs/` for architecture and ADRs
- `scripts/` for automation (setup, dev, load tests, etc.)

## Consequences

- Clear separation of deployables vs shared code.
- Infrastructure config lives with the codebase and stays versioned.
- Enables adding more services later (e.g. worker, gateway) without reorganizing.

