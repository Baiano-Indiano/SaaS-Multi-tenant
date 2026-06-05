# Pitfalls Research

**Domain:** Enterprise Integrations, Workflow Automation, and Telemetry Reporting
**Researched:** 2026-05-26
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Integration Token Leakage / Cross-Tenant Access

**What goes wrong:**
An admin token for Slack/Teams belonging to Tenant A is loaded or leaked to Tenant B, enabling unauthorized messages to be posted to Tenant A's private messaging channels.

**Why it happens:**
Storing all customer bot tokens in a single public schema table without proper isolation checks, or using weak organization IDs that allow cross-tenant query injections.

**How to avoid:**
1. Maintain strict physical schema isolation by storing the `integrations` credential table inside the tenant-specific schema rather than the `public` schema.
2. Encrypt token strings at rest in the database using a cryptographic utility (e.g. AES-256-GCM) with an environment-level key.

**Warning signs:**
Database query logs showing queries accessing integrations without active search path scoping or authorization failures.

**Phase to address:**
Phase 39 (OAuth Integrations & Marketplace)

---

### Pitfall 2: Infinite Event Execution Loops

**What goes wrong:**
A workflow trigger (e.g., `project.created`) initiates a Slack notification, which runs a webhook, which creates a project, emitting another `project.created` event, leading to an infinite recursive loop that exhausts Upstash Redis and API quotas.

**Why it happens:**
Allowing rule actions to trigger actions that emit events matching the same workflow trigger, with no execution depth tracking or loop detection.

**How to avoid:**
1. Maintain execution trace IDs and limit max workflow execution depth (e.g., maximum of 5 cascading actions per trigger chain).
2. Block automated events (like actions performed by the integration bot itself) from initiating new workflow executions.

**Warning signs:**
Rapid spike in CPU/Redis operations and a flood of repeating event entries in the LogStream.

**Phase to address:**
Phase 40 (Advanced Workflow Branching)

---

### Pitfall 3: Blocking Server Node.js Event Loop on PDF Generation

**What goes wrong:**
Heavy CPU consumption during PDF rendering blocks other concurrent Next.js API/UI requests, causing temporary responsiveness drops or server timeouts on serverless runtimes.

**Why it happens:**
Synchronously generating multi-page PDFs using synchronous engines (`pdfmake`) inside the main Next.js thread under high concurrency.

**How to avoid:**
1. Generate PDFs using streaming or non-blocking async buffers.
2. Offload heavy generation tasks to background worker routines or execute them asynchronously in response to queue events rather than during blocking web requests.

**Warning signs:**
High API response latencies and server-side timeouts when compilation requests overlap.

**Phase to address:**
Phase 41 (Email Digests & Automated Reporting)

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Unencrypted Bot Token Storage | Quick integration setup | Security compliance breach | Never |
| Simple logical `eval()` for rules | Instant implementation of dynamic formulas | Remote Code Execution (RCE) vulnerability | Never |
| Direct client-side PDF viewer | Avoids server-side library setup | Stalls client browsers and blocks CRON email reports | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Slack OAuth | Exposing the `client_secret` to client components | Exposing it strictly in server context (`NextRequest`) and exchanging codes server-to-server |
| Microsoft Teams | Assuming webhooks work without Entra permissions | Set up a Microsoft App Registration with correct Graph API scopes |

## "Looks Done But Isn't" Checklist

- [ ] **Slack Integration:** Bot works initially but fails later — verify token storage persistence and refresh handling.
- [ ] **Workflow Engine:** Works for simple conditions but crashes on missing keys — verify empty/null payload checks.
- [ ] **PDF Digests:** Works locally but fails in production build — verify correct font path loading.

---
*Pitfalls research for: Enterprise Integrations & Workflow Automation*
*Researched: 2026-05-26*
