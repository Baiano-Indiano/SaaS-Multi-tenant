# Phase 15 Context: External Integrations

## Core Decisions

1. **API Keys Strategy: Scoped per Organization**
   - **Decision**: API Keys are issued and validated against specific tenant contexts.
   - **Rationale**: Ensures enterprise customers can programmatically access only their own data schemas without risk of cross-tenant exposure.

2. **Webhooks Architecture: Upstash QStash**
   - **Decision**: Use QStash for reliable webhook delivery and retry logic instead of custom queueing.
   - **Rationale**: Serverless environments (like Vercel) are not ideal for background delivery retries; QStash guarantees delivery at scale.

## Technical Baseline

- **Components**: API Keys and Webhooks management UI added to Organization Settings.
- **Actions**: `api-keys.ts` and `webhooks.ts` providing CRUD capabilities.
- **Middleware**: Middleware validation logic for API boundaries.
- **Handler**: `qstash-handler` for background webhook dispatching.
