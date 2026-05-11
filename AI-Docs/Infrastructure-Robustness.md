# Infrastructure Robustness Guide

This document covers the hardening measures implemented to ensure the platform behaves predictably under failure conditions.

## 1. Boot-time Environment Validation

**File:** `src/lib/env.ts`

All critical environment variables are validated at application startup using **Zod**. In production, a missing or malformed variable causes an immediate crash with a clear error message. In development, safe defaults are used with console warnings.

### Validated Variables
| Variable | Requirement | Default (Dev) |
|---|---|---|
| `DATABASE_URL` | Valid Postgres URL | `postgres://...localhost:5432/saas_db` |
| `BETTER_AUTH_SECRET` | Min 16 characters | `dev-secret-change-me-in-prod` |
| `ENCRYPTION_KEY` | Exactly 64 hex chars | `000...000` |
| `UPSTASH_REDIS_REST_URL` | Valid URL | `http://localhost:6379` |
| `UPSTASH_REDIS_REST_TOKEN` | Non-empty string | `dev-token` |

### Usage
Import `env` from `@/lib/env` instead of using `process.env` directly:
```typescript
import { env } from "@/lib/env";

const db = connect(env.DATABASE_URL);
```

## 2. Circuit Breaker for Read Replicas

**File:** `src/lib/db/index.ts`

The `readDb` instance is wrapped in a **Circuit Breaker** proxy. If the read replica fails 3 consecutive times, all read queries are transparently routed to the primary database for 60 seconds. After the recovery window, the system probes the replica again.

### States
| State | Behavior |
|---|---|
| **Closed** (healthy) | All reads go to replica |
| **Open** (unhealthy) | All reads fall back to primary |
| **Half-Open** (probing) | One read is sent to replica to test recovery |

### Configuration
| Constant | Value | Description |
|---|---|---|
| `CB_THRESHOLD` | 3 | Failures before opening circuit |
| `CB_RECOVERY_MS` | 60000 | Milliseconds before probing replica again |

## 3. SIEM Export Observability

**File:** `src/lib/db/schema.ts`, `src/lib/security/audit-exporter.ts`

The audit export pipeline now tracks its own health:

| Field | Type | Purpose |
|---|---|---|
| `exportStatus` | `'idle' \| 'success' \| 'error'` | Current state of the export pipeline |
| `lastError` | `text \| null` | Human-readable error message (truncated to 500 chars) |

On **success**, `lastError` is cleared. On **failure**, the error is persisted so admins can diagnose issues directly from the dashboard without checking server logs.

### Retry Strategy
Uploads use **exponential backoff** with 3 attempts:
- Attempt 1: immediate
- Attempt 2: after 1 second
- Attempt 3: after 2 seconds
- Then: error is persisted and rethrown

## 4. Alert Rate Limiting (Anti-Spam)

**File:** `src/lib/security/anomaly-detection.ts`

Security alert emails are rate-limited to **1 per 30 minutes per user** using a Redis TTL key. This prevents inbox flooding during brute force attacks with rotating IPs.

### What is and isn't throttled
| Channel | Throttled? | Reason |
|---|---|---|
| Audit Log | ❌ No | Every anomaly must be recorded for compliance |
| In-App Notification | ❌ No | User needs to see alerts in real-time |
| Email (Resend) | ✅ Yes (30 min cooldown) | Prevents domain blacklisting from spam filters |

### Redis Key
```
user:{userId}:anomaly_email_cooldown → "1" (TTL: 1800s)
```
