# Phase 23: Native API Playground

## Overview
This phase implements a native API Playground integrated directly into the organization dashboard. It provides developers with a zero-friction environment to test the "Enterprise Edge API" using their own organization context and temporary test API keys.

## Technical Details

### API Specification
- **OpenAPI 3.1**: Defined in `src/lib/api/openapi.ts`.
- **Endpoints**:
  - `GET /v1/me`: Diagnostic endpoint to verify authentication and retrieve tenant context.
  - `GET /v1/pose/current`: Placeholder for real-time data access.
  - `GET /v1/pose/stats`: Placeholder for analytics access.

### Playground Integration
- **Scalar**: Uses `@scalar/api-reference-react` for the UI.
- **Client Component**: `src/components/developers/playground/playground-client.tsx`
  - Custom styling (Zinc-950 theme) to match the dashboard.
  - Interactive "Create Test Key" button for quick authentication injection.
  - Framer Motion animations for a premium feel.

### API Key Management
Handled in `src/app/actions/api-keys.ts`:
- **Generation**: Uses `sk_live_` prefix and cryptographic random values.
- **Security**: 
  - Keys are hashed using SHA-256 before storage.
  - High-performance lookup via Redis sync in `createApiKeyAction`.
  - Audit logging for every key creation/deletion.
  - Short-lived keys (1 day) by default for playground use.

### Data Architecture
- **Tenant Isolation**: API keys are stored in the tenant-specific schema.
- **Middleware Integration**: Keys are synced to a global Redis instance, allowing the API middleware to identify the tenant and authorize requests in sub-millisecond time.

## Verification Results
- **Linting**: Passed `npm run lint`.
- **Authentication**: Verified that API keys are correctly generated, injected into the Scalar reference, and tracked via audit logs.
- **UI/UX**: Verified the dark-themed integration with proper sidebar and request testing capabilities.
