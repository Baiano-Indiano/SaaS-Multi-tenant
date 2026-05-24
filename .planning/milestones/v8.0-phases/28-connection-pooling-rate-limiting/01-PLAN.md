# Phase 28: Connection Pooling & Rate Limiting

Implementação de pooling de conexões no PostgreSQL para eficiência em serverless e rate limiting baseado em Redis para proteção contra abusos.

## Status
- **Status:** ✅ Complete
- **Last Updated:** 2026-05-03

## Tasks
- [x] Configure `postgres-js` options for connection pooling (`max`, `idle_timeout`)
- [x] Implement Singleton pattern for `db` client in dev to prevent connection leaks
- [x] Set up `@upstash/ratelimit` with Redis for Edge compatibility
- [x] Implement tenant-aware API rate limiting in `proxy.ts` (100 req/min)
- [x] Implement IP-based Auth rate limiting in `proxy.ts` (10 req/min)
- [x] Verify rate limit headers (`X-RateLimit-Limit`, etc.) are returned to client

## Files Created/Modified
- **MODIFIED**: `src/lib/db/index.ts` — Added `clientOptions` for pooling and singleton registry
- **NEW**: `src/lib/rate-limit.ts` — Defined `apiRateLimit` and `authRateLimit` instances
- **MODIFIED**: `src/proxy.ts` — Integrated rate limit checks before processing requests
- **MODIFIED**: `.env.local` — Added `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
