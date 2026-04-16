# Phase 2 Research: Base UI & Landing Page (Theme Setup)

**Goal:** Implement the "Wow" factor Landing Page and Base layout structure.

## Technical Approaches & Discoveries

### 1. Shadcn/UI and Tailwind v4 Integration
- `shadcn/ui` was recently updated to support Tailwind v4 via its CLI (`npx shadcn@latest init`).
- Tailwind v4 uses `@theme` variables directly in CSS instead of `tailwind.config.js`.
- The user's design constraints define a Dark Mode absolute theme, leveraging `zinc` colors (`zinc-950` background, `zinc-800` borders). The `components.json` should align with a `zinc` base color.
- Necessary components need to be installed: `npx shadcn@latest add button select card switch sidebar`. The `sidebar` component (introduced recently) is extremely robust for SaaS dashboards and fulfills decision **D-13** perfectly.

### 2. Next.js App Router Structure
- Route groups are required to enforce visual segregation:
  - `src/app/(marketing)/layout.tsx` & `page.tsx`: Uses Anime.js, highly visual, minimal state.
  - `src/app/(app)/layout.tsx` & `page.tsx`: Protected dashboard routes, collapsible sidebar, Framer Motion for state changes.
- Root layout (`src/app/layout.tsx`) continues acting as the global wrapper (font injection, AuthProviders, global CSS).

### 3. Anime.js vs React VDOM Clash Prevention
- Based on `PITFALLS.md` and `REQUIREMENTS.md`, mixing Anime.js (which mutates the DOM directly) with React's VDOM can cause hydration and unmounting bugs.
- **Solution:** Create isolated client components (e.g., `<HeroGraphic />`) wrapped with `"use client"`. The animation targets must be `useRef` tracked, and animations should run inside `useLayoutEffect` (or `useEffect`) with proper cleanup (`anime.remove(targets)` on unmount). This satisfies **D-10, D-11, and D-12**.

### 4. Layout Base: The Dashboard Sidebar & Tenant Switcher
- The dashboard will utilize the Shadcn Sidebar component framework (`<SidebarProvider>`, `<Sidebar>`, etc).
- The `Tenant Switcher` (**D-14**) must be a separate client-side component (or hybrid) that lives at the top of the Sidebar (`<SidebarHeader>`). It will use Shadcn's `<Select>` or a custom `<DropdownMenu>` to list the active user's organizations and fire state updates.

## Dependencies Identified
- Core UI: `lucide-react`, `clsx`, `tailwind-merge` (already managed by shadcn/ui).
- Animations: `animejs` (for Marketing), `framer-motion` (for App). 
- All external dependencies are already present in `package.json` according to Phase 1 setup.

## Validation Architecture
- Verify `(marketing)` and `(app)` directories exist and apply their respective layouts separately.
- Verify the Landing page features the Bento Grid, Social Proof section, Pricing table, and Hero block.
- Verify `animejs` fires correctly on initial load of the Hero component and unmounts cleanly without throwing DOM reference errors when navigating away.
- Verify the `app` dashboard layout renders a Shadcn Sidebar with a static or prototype Tenant Switcher UI (deep backend logic for this comes in Phase 3).
