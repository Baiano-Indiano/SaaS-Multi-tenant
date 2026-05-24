---
wave: 1
depends_on: []
files_modified:
  - package.json
  - next.config.ts
  - src/components/marketing/HeroAssembly.tsx
  - src/components/marketing/scroll-reveal.tsx
  - src/components/dashboard/dashboard-client.tsx
autonomous: true
---

# Phase 30: Performance & Motion Optimization

## Objective
Implement `prefers-reduced-motion` logic for GSAP animations, configure `@next/bundle-analyzer` to audit bundle size, and apply lazy loading to heavy chart components.

## Tasks

### 1. Bundle Analyzer Setup
<read_first>
- next.config.ts
- package.json
</read_first>
<action>
1. Install `@next/bundle-analyzer` as a dev dependency: `npm i -D @next/bundle-analyzer`.
2. Add the `"analyze": "cross-env ANALYZE=true next build"` script to `package.json` (you may need to install `cross-env` as well if on Windows: `npm i -D cross-env`).
3. Update `next.config.ts` to integrate `@next/bundle-analyzer`. Wrap the configuration step by step:
   ```typescript
   import withBundleAnalyzer from '@next/bundle-analyzer';

   const bundleAnalyzer = withBundleAnalyzer({
     enabled: process.env.ANALYZE === 'true',
   });
   
   // Apply bundleAnalyzer
   export default withSentryConfig(bundleAnalyzer(withNextIntl(nextConfig)), { ... });
   ```
</action>
<acceptance_criteria>
- `package.json` contains `"analyze"` in scripts and `@next/bundle-analyzer` in devDependencies.
- `next.config.ts` imports `@next/bundle-analyzer` and wraps the config correctly.
</acceptance_criteria>

### 2. Implement `prefers-reduced-motion` in ScrollReveal
<read_first>
- src/components/marketing/scroll-reveal.tsx
</read_first>
<action>
Modify `src/components/marketing/scroll-reveal.tsx` to use `gsap.matchMedia()`.
Inside the `useGSAP` hook:
1. Initialize `let mm = gsap.matchMedia(containerRef);`.
2. Move the existing animation into: `mm.add("(prefers-reduced-motion: no-preference)", () => { ... })`.
3. Add a fallback animation for reduced motion: `mm.add("(prefers-reduced-motion: reduce)", () => { ... })`.
   - The fallback should only animate `opacity: 0` to `opacity: 1` (no `x` or `y` translation).
</action>
<acceptance_criteria>
- `src/components/marketing/scroll-reveal.tsx` uses `gsap.matchMedia()`.
- Separate logic exists for `(prefers-reduced-motion: no-preference)` and `(prefers-reduced-motion: reduce)`.
</acceptance_criteria>

### 3. Implement `prefers-reduced-motion` in HeroAssembly
<read_first>
- src/components/marketing/HeroAssembly.tsx
</read_first>
<action>
Modify `src/components/marketing/HeroAssembly.tsx` to respect user motion preferences.
Inside the `useGSAP` hook:
1. Initialize `let mm = gsap.matchMedia(containerRef);`.
2. Place the current complex timeline animation into `mm.add("(prefers-reduced-motion: no-preference)", () => { ... })`.
3. Add a simplified animation for `mm.add("(prefers-reduced-motion: reduce)", () => { ... })`:
   - Animate the `.scroll-hint` fading out.
   - Animate the plates (`.plate-sidebar`, `.plate-header`, etc.) fading in (`opacity: 0` to `opacity: 1`) without complex 3D transforms (`rotateX`, `rotateY`, `scale`, etc.). Just simple opacity.
   - Omit the `.assembly-bg-glow` pulse animation or disable it entirely for reduced motion.
</action>
<acceptance_criteria>
- `src/components/marketing/HeroAssembly.tsx` uses `gsap.matchMedia()`.
- The 3D transforms are only applied when `prefers-reduced-motion: no-preference`.
</acceptance_criteria>

### 4. Implement Component Lazy Loading (Charts)
<read_first>
- src/components/dashboard/dashboard-client.tsx
</read_first>
<action>
Update `src/components/dashboard/dashboard-client.tsx` to use `next/dynamic` for heavy chart components.
Replace static imports for `OverviewChart` and `AreaChart` with dynamic imports:
```typescript
import dynamic from "next/dynamic";
const OverviewChart = dynamic(() => import("./overview-chart").then(m => m.OverviewChart), { ssr: false });
const AreaChart = dynamic(() => import("./area-chart").then(m => m.AreaChart), { ssr: false });
```
</action>
<acceptance_criteria>
- `src/components/dashboard/dashboard-client.tsx` uses `next/dynamic` to load `OverviewChart` and `AreaChart`.
- The imports are set to `{ ssr: false }` since charts typically depend on client-side rendering APIs (like Recharts).
</acceptance_criteria>

## Verification
- Run `npm run analyze` to verify the bundle analyzer tool generates the `.next/analyze` HTML reports.
- Emulate `prefers-reduced-motion: reduce` in browser DevTools and verify that the GSAP animations degrade gracefully to opacities only.
