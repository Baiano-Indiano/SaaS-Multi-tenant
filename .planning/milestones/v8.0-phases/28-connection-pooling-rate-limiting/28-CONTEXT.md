# Phase 28: Connection Pooling & Rate Limiting - Context

**Gathered:** 2026-05-03
**Status:** Retroactively Documented
**Source:** discuss-phase (retroactive)

<domain>
## Phase Boundary

Infrastructure optimization focused on database connection efficiency and request rate protection. Implements connection pooling for PostgreSQL (via `postgres-js` options) and multi-tier rate limiting using Upstash Redis.
</domain>

<decisions>
## Implementation Decisions

### Connection Pooling
- **Driver**: Use `postgres-js` (via Drizzle ORM) which supports native pooling without external proxies like PgBouncer for most serverless use cases.
- **Configuration**: 
    - `max`: Default to 10 connections per instance (configurable via `DB_POOL_MAX`).
    - `idle_timeout`: Set to 20 seconds to prevent leaking connections in serverless environments.
- **Singleton Pattern**: Use a global registry in development to prevent hot-reloading from exhausting connections.

### Rate Limiting (Upstash Redis)
- **Architecture**: Implement rate limiting at the `proxy.ts` (Middleware) level for maximum protection before hitting compute/DB.
- **Tiers**:
    - **API v1**: 100 requests per minute per organization (tenant-aware).
    - **Auth**: 10 requests per minute per IP to prevent brute-force attacks on login/signup.
- **Redis Connection**: Use `@upstash/redis` with HTTP transport for Edge compatibility.
</decisions>

<canonical_refs>
## Canonical References

- [Upstash Ratelimit Documentation](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview)
- [postgres-js Connection Options](https://github.com/porsager/postgres#connection-options)
</canonical_refs>

<specifics>
## Specific Ideas

- Return `X-RateLimit-*` headers on 429 responses.
- Use `slidingWindow` algorithm for smoother rate limiting behavior.
</specifics>

<deferred>
## Deferred Ideas

- Per-tenant custom rate limits (currently hardcoded).
- Webhook-specific rate limits.
</deferred>
