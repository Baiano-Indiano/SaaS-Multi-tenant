# Phase 12: Settings Navigation Architecture & UI/UX

Refactoring the organization settings from a query-parameter-based approach to a robust sub-route architecture, while enhancing the visual feedback through premium transitions and refined active states.

## User Review Required

> [!IMPORTANT]
> - **Navigation Change**: Standardized settings URLs to `/org/[slug]/settings/[sub-route]`.
> - **Active States**: Implementing a "Subtle Background Shift" pattern in the sidebar for a more elegant enterprise feel.
> - **Transitions**: Migrating from horizontal slides to "Fade-and-Scale" (with micro-Y movement) for internal sub-route navigation.

## Proposed Changes

### [Structural] Routing & Core Logic
- **[MODIFY] [settings/page.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/(app)/org/%5BorgSlug%5D/settings/page.tsx)**: Finalize the redirect to `/general`.
- **[NEW] [settings/general/page.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/(app)/org/%5BorgSlug%5D/settings/general/page.tsx)**: Implement the core organization settings view using `getTenantDb`.
- **[MODIFY] [settings/layout.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/(app)/org/%5BorgSlug%5D/settings/layout.tsx)**: Update layout to support sub-route navigation and standardized padding.

### [UI/UX] Navigation & Transitions
- **[MODIFY] [settings-nav.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/settings/settings-nav.tsx)**:
    - Update active state to `bg-zinc-800/50` or `zinc-900`.
    - Set active text color to `zinc-50`.
- **[MODIFY] [app-sidebar.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/app-sidebar.tsx)**:
    - Implement `usePathname` to detect active route.
    - Highlight active organization and its sub-pages with the "Subtle Background Shift".
- **[MODIFY] [org-route-transition.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/layout/org-route-transition.tsx)**:
    - Replace horizontal slide with `fade-and-scale`.
    - Retain micro-Y movement (10-20px).

### [Documentation]
- **[MODIFY] [ARCHITECTURE.md](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/ARCHITECTURE.md)**: Add "Routing Conventions" section documenting the preference for sub-routes vs query params.

## Verification Plan

### Automated Tests
- Run `npm run lint` to ensure no routing conflicts.
- (Optional) Playwright test to verify active class presence on navigation items.

### Manual Verification
- Navigate through all settings tabs: General, Members, Activity.
- Observe the GSAP transition fluidity.
- Confirm sidebar correctly highlights "Settings" even when on `/settings/members`.
