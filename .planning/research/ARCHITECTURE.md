# Architecture Research

**Domain:** Enterprise Integrations, Workflow Automation, and Telemetry Reporting
**Researched:** 2026-05-26
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js App / API Routes              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │ OAuth Routes │  │ Event Triggers│  │ Scheduled Crons  │  │
│  │  (Slack/MS)  │  │  (workflows)  │  │  (QStash/Resend) │  │
│  └──────┬───────┘  └───────┬───────┘  └────────┬─────────┘  │
│         │                  │                   │            │
├─────────┼──────────────────┼───────────────────┼────────────┤
│         ▼                  ▼                   ▼            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │               getTenantDb (Tenant Isolation)           │ │
│  └─────────────────────────┬──────────────────────────────┘ │
├────────────────────────────┼────────────────────────────────┤
│                            ▼                                │
│                   PostgreSQL Database                       │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │   Public Schema Table   │  │   Tenant Schema Tables   │  │
│  │   (orgs, memberships)   │  │   (integrations, rules)  │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `OAuth Webhook Handlers` | Handles the redirection and secure token exchange for external marketplaces | Next.js API Routes (e.g. `/api/connectors/slack/callback`) |
| `Rule Engine (json-rules-engine)` | Evaluates event payloads against user-defined JSON rules safely | Server-side JS logic mapping trigger inputs to rule outputs |
| `Scheduled Cron Scheduler` | Invokes periodic telemetry compilation and report generation | Upstash QStash crons invoking authenticated HTTP routes |
| `PDF compiler (pdfmake)` | Compiles clean, lightweight PDF buffers on the server | Pure Node.js module that does not require a browser |

## Recommended Project Structure

```
src/
├── app/
│   └── api/
│       ├── connectors/
│       │   ├── slack/
│       │   │   ├── authorize/route.ts   # Redirects to Slack
│       │   │   └── callback/route.ts    # OAuth code exchange
│       │   └── teams/
│       │       ├── authorize/route.ts
│       │       └── callback/route.ts
│       └── cron/
│           └── telemetry/route.ts       # Cron triggered telemetry compiles
├── lib/
│   ├── db/
│   │   └── schema.ts                    # Add tables for integrations/workflows
│   ├── integrations/
│   │   ├── slack.ts                     # Slack Client API functions
│   │   └── teams.ts                     # Teams Microsoft Graph Client
│   ├── reporting/
│   │   └── pdf-generator.ts             # Compile pdfmake documents
│   └── workflows/
│       ├── engine.ts                    # evaluates json-rules-engine rules
│       └── trigger.ts                   # emitEvent fan-out wrapper
```

## Architectural Patterns

### Pattern 1: Isolated Connector Token Storage (Rule 2 Compliant)

Integration tokens and configurations are stored directly in the tenant-specific tables, keeping all enterprise customer tokens isolated at the database schema level.

```typescript
// src/lib/integrations/slack.ts
import { getTenantDb } from "@/lib/db/tenant-db";
import { integrations } from "@/lib/db/schema";

export async function saveSlackToken(userId: string, orgId: string, botToken: string, teamName: string) {
  return await getTenantDb(userId, orgId, async (tenantDb) => {
    return await tenantDb.insert(integrations).values({
      id: crypto.randomUUID(),
      type: "SLACK",
      credentials: { botToken, teamName },
      isActive: true,
    }).onConflictDoUpdate({
      target: integrations.type,
      set: { credentials: { botToken, teamName }, isActive: true }
    });
  });
}
```

### Pattern 2: Multi-Action Workflow Pipeline (Observer Pattern)

Trigger actions are decoupled from core server logic. Server actions emit lightweight events, and a separate workflow processor resolves rules and executes integrations.

```typescript
// src/lib/workflows/engine.ts
import { Engine } from "json-rules-engine";

export async function evaluateWorkflowRules(eventPayload: any, ruleDefinition: any) {
  const engine = new Engine();
  engine.addRule(ruleDefinition);
  
  const results = await engine.run(eventPayload);
  return results.events.length > 0;
}
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10k crons/mo | Direct HTTP invocations from QStash to Next.js route is fast and clean. |
| 10k-100k crons/mo | Compile PDFs in edge functions or dispatch message cues to background queues to avoid blocking main Next.js thread. |

---
*Architecture research for: Enterprise Integrations & Workflow Automation*
*Researched: 2026-05-26*
