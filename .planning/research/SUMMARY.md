# Project Research Summary

**Project:** Multi-Tenant SaaS Starter
**Domain:** Enterprise Integrations & Workflow Automation (v10.0)
**Researched:** 2026-05-26
**Confidence:** HIGH

## Executive Summary

This research establishes the core stack, features, and architecture patterns required to deliver Milestone v10.0 (Enterprise Integrations & Workflow Automation) securely. The main goal is to expand the platform's connectivity with native Slack/Microsoft Teams OAuth integrations, event-driven conditional workflows, and scheduled telemetry email/PDF digests.

The key technical challenges are (1) maintaining strict tenant data isolation (Rule 2) when storing external integration tokens, (2) preventing infinite execution loops in cascading workflow rules, and (3) generating scheduled PDF reports on the server without blocking the Next.js event loop or crashing under serverless memory constraints. We recommend using `@slack/web-api` and Microsoft Graph clients for integrations, `json-rules-engine` for safe rule matching, and `pdfmake` for serverless-compatible server-side PDF compilation.

## Key Findings

### Recommended Stack
- **Slack Connector:** `@slack/web-api` for server-side OAuth exchange and message delivery.
- **Teams Connector:** `@microsoft/microsoft-graph-client` to communicate with Microsoft Graph for Teams channel delivery.
- **Rule Evaluation:** `json-rules-engine` for evaluating trigger filters safely.
- **PDF Compilation:** `pdfmake` for lightweight, non-blocking PDF generation.
- **Email Dispatch:** `resend` (already installed) for sending summaries.

### Expected Features
- **Table Stakes:** Slack OAuth integration, weekly email digests, JSON/CSV exports.
- **Differentiators:** MS Teams OAuth integration, conditional triggers matching event values, high-polish scheduled PDF attachments.
- **Anti-Features:** Recursive triggers, custom HTML email editors.

### Architecture Approach
- Storing integration bot tokens and custom rules directly in tenant-specific database schemas (Rule 2).
- Server actions emit lightweight events, which are processed asynchronously by the workflow pipeline using the rule evaluation engine.
- Cron schedules (via QStash) trigger Next.js routes to query public schemas, activate the tenant's context, compile the data, and dispatch emails.

### Critical Pitfalls
- **Token Leakage:** Prevented by encrypting tokens at rest and isolating tables inside tenant schemas.
- **Infinite Loops:** Prevented by tracking trigger execution depth (limit = 5).
- **CPU Thread Blocking:** Prevented by compiling PDFs asynchronously using stream/buffer outputs.

## Implications for Roadmap

Suggested phase structure:

### Phase 39: OAuth Integrations & Marketplace (Slack/Teams)
- **Rationale:** Establishes the foundations of external token exchange and storage.
- **Delivers:** Integrations setup UI, secure OAuth callback routes, and credentials storage.
- **Avoids:** Token leakage pitfalls by encrypting keys at rest.

### Phase 40: Advanced Workflow Branching
- **Rationale:** Connects event triggers to integrations via business logic rules.
- **Delivers:** Event triggers observer pipeline, rule-engine integrations, and conditional execution.
- **Avoids:** Execution loop pitfalls by implementing trace headers and depth limits.

### Phase 41: Email Digests & Automated Reporting
- **Rationale:** Connects database statistics to automated delivery.
- **Delivers:** Weekly scheduled digests (Resend) and pdfmake reporting service.
- **Avoids:** CPU event blocking by handling compilation in asynchronous tasks.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Off-the-shelf official packages with low server footprint. |
| Features | HIGH | Table stakes features well defined with explicit scope limits. |
| Architecture | HIGH | Aligns with existing tenant-isolation logic (`getTenantDb`). |
| Pitfalls | HIGH | Specific mitigations identified for looping and blocking concerns. |

**Overall confidence:** HIGH

### Gaps to Address
- **Local HTTPS Testing:** Slack and MS Teams webhook delivery require public HTTPS callbacks. Developers must use `ngrok` or similar tools for local development verification.

## Sources
- Official Slack OAuth Documentation
- Microsoft Graph API Documentation
- pdfmake and json-rules-engine Official API specs

---
*Research completed: 2026-05-26*
*Ready for roadmap: yes*
