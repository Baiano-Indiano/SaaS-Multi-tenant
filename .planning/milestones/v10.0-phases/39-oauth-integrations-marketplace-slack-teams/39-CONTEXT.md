# Phase 39: OAuth Integrations & Marketplace (Slack/Teams) - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers native OAuth-based marketplace integrations for Slack and Microsoft Teams. It enables tenants to authorize and install these connectors, stores their credentials securely within schema-isolated databases, and exposes an Integrations management panel under Organization Settings.

</domain>

<decisions>
## Implementation Decisions

### OAuth & Security callback
- **D-01:** Redirection callback verification will be stateless using a signed JWT token passed in the `state` parameter containing the initiating `userId` and `organizationId` to prevent CSRF and link credentials back to the correct tenant.
- **D-02:** Bot credentials, access tokens, and webhook configurations will be encrypted at rest in Node.js using AES-256-GCM with a server-level environment key (`CONNECTOR_SECRET`) before inserting into the database.

### Integration Connectivity
- **D-03:** Microsoft Teams integration will support a dual strategy: native MS Graph API OIDC authentication flow (for automated channel listings and interactive cards) with a fallback custom incoming webhook URL option (for easy manual setup).

### User Interface & Navigation
- **D-04:** Integrations management will reside in a new settings sub-route: `/org/[orgSlug]/settings/integrations`. It will present a grid of card components representing available connectors, complete with status tags (Connected, Disconnected) and drawer overlay menus for setup/disconnection.

### the agent's Discretion
- The choice of layout animations for the integrations grid cards (e.g. Framer Motion fade-ins) is at the developer's discretion, matching the general dashboard style.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` — Core value, tenant boundaries, and project metadata
- `.planning/REQUIREMENTS.md` — INT-01 and INT-02 requirements definitions
- `.planning/ROADMAP.md` — Phase 39 objectives and success criteria

### Domain Research
- `.planning/research/STACK.md` — Recommended integration libraries and versions
- `.planning/research/SUMMARY.md` — Research summary and roadmap implications
- `.planning/research/PITFALLS.md` — Security and leakage pitfalls to prevent

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `connectors` pgTable in `src/lib/db/schema.ts` — Existing database structure for integrations.
- `getTenantDb` helper in `src/lib/db/tenant-db.ts` — Swapping context safely to execute tenant-isolated operations.

### Integration Points
- `/org/[orgSlug]/settings` route structure — Placement for new `/integrations` sub-route.
- `src/proxy.ts` middleware gateway — Ensure callback APIs (e.g. `/api/connectors/*`) are correctly routed and not blocked.

</code_context>

<specifics>
## Specific Ideas

- Slack OAuth flow will request minimal bot scopes: `chat:write`, `incoming-webhook`.
- Custom webhook URLs for MS Teams will expect standard adaptive card payloads.

</specifics>

<deferred>
## Deferred Ideas

- Multi-action workflow chains and workflow branching filters are deferred to Phase 40.
- Scheduled telemetry digest scheduling is deferred to Phase 41.

</deferred>

---
*Phase: 39-oauth-integrations-marketplace-slack-teams*
*Context gathered: 2026-05-26*
