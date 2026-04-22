# Retroactive Plan: GSAP Migration & UI Animation System

This plan documents the transition from Anime.js to GSAP 3.x for all high-impact UI animations, ensuring better React lifecycle integration and a more "Enterprise Premium" feel.

## Proposed Changes

### Core UI Components
- **[MODIFY] [button.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/ui/button.tsx)**: Added GSAP-powered micro-interactions for pointer down/up.
- **[MODIFY] [app-sidebar.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/app-sidebar.tsx)**: Implemented staggered entrance animations for sidebar items.
- **[MODIFY] [alert-dialog.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/ui/alert-dialog.tsx)**, **[dialog.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/ui/dialog.tsx)**, **[dropdown-menu.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/ui/dropdown-menu.tsx)**: Refined transitions for smoother entry.

### Documentation & Config
- **[MODIFY] [package.json](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/package.json)**: Added `gsap` and `@gsap/react`, removed `animejs` (implied).
- **[MODIFY] [PROJECT.md](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/.planning/PROJECT.md)**, **[README.md](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/README.md)**: Updated tech stack references to GSAP.

## Verification
- Visual inspection of sidebar entrance.
- Interactive test of button click states.
- Accessibility check (respects `prefers-reduced-motion`).
