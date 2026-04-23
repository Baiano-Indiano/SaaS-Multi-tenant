# Retroactive Plan: Auth & App Refinements

General improvements to the authentication flow, organization layouts, and internal debugging infrastructure.

## Proposed Changes

### Authentication
- **[MODIFY] [AuthForm.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/auth/AuthForm.tsx)**: Improved error handling and "Create Account" suggestion flow.
- **[NEW] [feedback-banner.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/ui/feedback-banner.tsx)**: Reusable feedback component for auth/system messages.
- **[MODIFY] [auth/index.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/auth/index.ts)**: Refined session logic and plugin configuration.

### App Shell & Layout
- **[MODIFY] [layout.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/(app)/org/%5BorgSlug%5D/layout.tsx)**: Optimized organization layout.
- **[NEW] [settings-nav.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/settings/settings-nav.tsx)**: Refactored settings navigation for better reusability.
- **[NEW] [src/components/layout/](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/layout/)**: Centralized layout components.

### Infrastructure & Debugging
- **[NEW] [src/app/api/test/](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/api/test/)**, **[src/app/api/auth/test/](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/api/auth/test/)**: Internal endpoints for verifying auth and multi-tenant isolation.
- **[NEW] [pose-request-debug.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/pose-request-debug.ts)**: Diagnostic utility for inspecting server-side requests.

## Verification
- Verify "User not found" triggers registration suggestion in AuthForm.
- Ensure settings navigation remains consistent across org switches.
- Test internal API routes for correct status codes.
