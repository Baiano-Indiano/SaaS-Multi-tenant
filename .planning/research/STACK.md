# Stack Research

**Domain:** Enterprise Integrations, Workflow Automation, and Telemetry Reporting
**Researched:** 2026-05-26
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@slack/web-api` | 7.x | Slack API interactions | Official Slack SDK for Web API operations (sending messages, exchanging OAuth codes) |
| `@microsoft/microsoft-graph-client` | 3.x | Microsoft Teams integrations | Official SDK to communicate with Microsoft Graph API for MS Teams message delivery |
| `resend` | 6.12.0 | Email delivery engine | Currently installed and verified for transactional and batch email delivery |
| `pdfmake` | 0.2.x | Server-side PDF generation | Declarative JSON layout syntax that runs on serverless environments without headless browser overhead |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `json-rules-engine` | 6.x | Rule evaluation for workflows | Evaluating conditional workflows dynamically on the server without executing arbitrary code |
| `lucide-react` | 0.43.0+ | UI Icons for marketplace | Displaying Slack/Teams integration icons in the dashboard |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `ngrok` | Local tunnel for webhooks/OAuth | Slack and Microsoft Teams require HTTPS for OAuth callback routes and event subscriptions. |

## Installation

```bash
# Core & Integrations
npm install @slack/web-api @microsoft/microsoft-graph-client pdfmake json-rules-engine
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `pdfmake` | `@react-pdf/renderer` | Only if generating PDFs dynamically in the client's browser; crashes during server-only cron executions. |
| `pdfmake` | `Playwright` / `Puppeteer` | If absolute pixel-perfect HTML-to-PDF matches are needed and server resources (RAM/CPU) are unlimited. |
| Custom HTTP client | `@slack/bolt` | Bolt is useful for interactive bots, but for simple messaging integration, direct `@slack/web-api` calls are lighter. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Client-side `PDFViewer` | Scheduled cron jobs have no DOM access or browser window. | Server-side document builder (`pdfmake`). |
| Custom logical string `eval()` | Executing user-defined rules with `eval()` introduces massive RCE vulnerabilities. | Safe structured rule engines like `json-rules-engine`. |

## Sources

- Official Slack OAuth Guide: `https://api.slack.com/legacy/oauth-v2`
- Official Microsoft Graph Teams API: `https://learn.microsoft.com/en-us/graph/api/resources/teams-api-overview`
- pdfmake Node Server Guide: `https://pdfmake.github.io/docs/`
- json-rules-engine GitHub: `https://github.com/CacheControl/json-rules-engine`

---
*Stack research for: Enterprise Integrations & Workflow Automation*
*Researched: 2026-05-26*
