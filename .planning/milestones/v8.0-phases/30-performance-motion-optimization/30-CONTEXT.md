# Phase 30: Performance & Motion Optimization - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Source:** discuss-phase (auto mode)

<domain>
## Phase Boundary

Performance and motion optimization for the Next.js application. Focuses on respecting user accessibility preferences (prefers-reduced-motion) for GSAP/Framer Motion animations and performing bundle size analysis/tree-shaking.
</domain>

<decisions>
## Implementation Decisions

### Motion & Accessibility
- **Reduced Motion Strategy**: Respect `prefers-reduced-motion` OS/Browser settings. For GSAP and Framer Motion, fallback to simple opacities/fades or disable animations completely when reduced motion is preferred, instead of keeping complex kinetic motions.
- **GSAP Configuration**: Use `gsap.matchMedia()` to implement the reduced motion logic at the timeline level.

### Performance & Bundle Size
- **Bundle Analyzer**: Use `@next/bundle-analyzer` to audit the application bundle.
- **Tree-Shaking**: Ensure GSAP plugins and large dependencies are imported using path-specific or tree-shakeable patterns.
- **Lazy Loading**: Identify heavy non-critical components (like the GSAP Hero or complex charts) and load them dynamically using `next/dynamic` if they impact initial load severely.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.
</canonical_refs>

<specifics>
## Specific Ideas

- Focus GSAP optimization heavily on the landing page, where motion is more prominent.
- Do not break functionality when motion is reduced; ensure UI states remain accessible.
</specifics>

<deferred>
## Deferred Ideas

None
</deferred>
