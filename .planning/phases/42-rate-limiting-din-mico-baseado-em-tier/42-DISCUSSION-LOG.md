# Phase 42: Rate Limiting Dinâmico Baseado em Tier - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 42-rate-limiting-din-mico-baseado-em-tier
**Areas discussed:** Cache and Fallback, Rate Limiting Window, Webhook Sync

---

## Cache and Fallback for Plan Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Option A | Cache Org + Fallback API Key (Store plan in org Redis key, fallback to keyData.plan) | ✅ |
| Option B | Query relational DB on cache miss | |
| Option C | Fall back to Free limits on cache miss | |

**User's choice:** Option A
**Notes:** Relational database calls inside proxy.ts should be avoided to prevent latency spikes and load on PostgreSQL.

---

## Rate Limiting Window

| Option | Description | Selected |
|--------|-------------|----------|
| Sliding Window | Sliding window of 1 minute (30,000 req/min for Enterprise) | ✅ |
| Fixed Window | Fixed per-second window (500 req/s) | |

**User's choice:** Sliding Window
**Notes:** Sliding Window accommodates client batch bursts gracefully compared to strict per-second limits.

---

## Webhook Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Write-Through | Immediate Redis write-through during webhook updates | ✅ |
| TTL Expire | Depend on cache expiration | |

**User's choice:** Write-Through
**Notes:** Upgrades must reflect instantly in API rate limits without lag.

---

## the agent's Discretion
- Redis key structure.
- Details of headers.

## Deferred Ideas
None.
