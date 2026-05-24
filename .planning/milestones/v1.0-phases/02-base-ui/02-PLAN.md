---
wave: 1
depends_on: []
files_modified:
  - "components.json"
  - "src/app/globals.css"
  - "src/app/page.tsx"
  - "src/app/(marketing)/layout.tsx"
  - "src/app/(marketing)/page.tsx"
  - "src/app/(app)/dashboard/layout.tsx"
  - "src/app/(app)/dashboard/page.tsx"
  - "src/components/marketing/hero-graphic.tsx"
  - "src/components/app-sidebar.tsx"
autonomous: true
---

# Phase 2: Base UI & Landing Page (Theme Setup)

## Objective
Implement the Next.js App Router structure with route groups `(marketing)` and `(app)`, configure Tailwind CSS v4 and the `shadcn/ui` theme, and build the initial Marketing Landing Page and App Dashboard structures.

## Security Threat Model
- **Threat:** Client-side libraries leaking sensitive environment variables or unmounting errors causing XSS vulnerabilities.
- **Mitigation:** Ensure Anime.js components isolate themselves within React boundaries using `useEffect` rendering loops. Strict encapsulation of marketing vs app routes.

## Verification
- Route `/` loads the marketing landing page structure (Hero, Features, Pricing) with Anime.js animations.
- Route `/dashboard` loads the App dashboard with the shadcn/ui Sidebar structure.

## Tasks

<task>
<read_first>
- src/app/layout.tsx
- src/app/globals.css
</read_first>
<action>
1. Run `npx shadcn@latest init -d` to initialize `components.json` with standard defaults. Since Tailwind v4 is in use, shadcn is updated to support it directly.
2. Edit `src/app/globals.css`, replacing contents entirely. Include `@import "tailwindcss";`. Ensure root theme variables set a "Corporativo Moderno" dark mode (e.g., base background to `zinc-950`, text to `zinc-50`).
3. Set the global font-family in the document body. 
</action>
<acceptance_criteria>
- `components.json` exists in project root.
- `src/app/globals.css` imports tailwindcss and establishes robust CSS tokens for `--background` and `--foreground`.
- `npx shadcn@latest init` completes cleanly.
</acceptance_criteria>
</task>

<task>
<read_first>
- components.json
</read_first>
<action>
Run the shadcn CLI in non-interactive mode to install the fundamental components identified in research:
`npx shadcn@latest add button card select switch sidebar separator skeleton tooltip -y`
</action>
<acceptance_criteria>
- `src/components/ui/button.tsx` exists.
- `src/components/ui/sidebar.tsx` exists.
</acceptance_criteria>
</task>

<task>
<read_first>
- src/app/page.tsx
</read_first>
<action>
1. Delete `src/app/page.tsx`.
2. Create directories `src/app/(marketing)`.
3. Create `src/app/(marketing)/layout.tsx`. Export a `MarketingLayout` component wrapping `children` in a div with `min-h-screen bg-zinc-950 text-zinc-50`.
4. Create `src/app/(marketing)/page.tsx`. Export a default `LandingPage` component. 
5. Build the primary landing page structure in `page.tsx`:
   - A `<section>` for Hero consisting of a bold H1, a technical subtitle, and two buttons (Primary & Secondary layout).
   - A `<section>` for Social Proof (row of placeholder tech logos).
   - A `<section>` for Features (Bento Grid layout placeholder using CSS grid).
   - A `<section>` for Pricing.
   - A `<section>` for Bottom CTA.
</action>
<acceptance_criteria>
- `src/app/page.tsx` is deleted.
- Content on `/` renders the `LandingPage` component from the `(marketing)` group.
- The `(marketing)/page.tsx` file contains structured visual blocks correctly named.
</acceptance_criteria>
</task>

<task>
<read_first>
- src/app/(marketing)/page.tsx
- package.json
</read_first>
<action>
1. Create `src/components/marketing/hero-graphic.tsx`.
2. Mark the file with `"use client"`.
3. Import `anime` from `animejs`. Create a `useRef` target pointing to an abstract dashboard layout DOM tree container.
4. Implement a `useLayoutEffect` that runs an anime.js stagger animation (e.g. cascading opacity and translateY on `.stagger-item` class elements). Make sure to return an `anime.remove(targets)` cleanup function.
5. Import and mount `<HeroGraphic />` into the Hero block inside `src/app/(marketing)/page.tsx`.
</action>
<acceptance_criteria>
- `<HeroGraphic />` fires the animeJS timeline successfully on mount.
- Navigating away does not cause orphaned DOM target errors (cleanup works).
</acceptance_criteria>
</task>

<task>
<read_first>
- src/app/(marketing)/layout.tsx
</read_first>
<action>
1. Create directories `src/app/(app)/dashboard`.
2. Create `src/components/app-sidebar.tsx`. Use Shadcn's `<Sidebar>`, `<SidebarHeader>`, `<SidebarContent>`, and `<SidebarGroup>`. In `<SidebarHeader>`, insert a text placeholder "Tenant Switcher" indicating the active organization context component (D-14).
3. Create `src/app/(app)/dashboard/layout.tsx`. Import `<SidebarProvider>` and `<AppSidebar>`. Construct the layout to wrap `children`, ensuring the `<SidebarTrigger />` exists so users can collapse the UI.
4. Create `src/app/(app)/dashboard/page.tsx`. Export a page displaying a simple main dashboard welcome card to reserve space.
</action>
<acceptance_criteria>
- `/dashboard` path returns the Sidebar layout correctly configured.
- The "Tenant Switcher" placeholder is visible within the header of the app sidebar.
- Navigation between `/` and `/dashboard` resolves correctly to different groups.
</acceptance_criteria>
</task>
