# Phase 24: Apple-Style Landing Page Overhaul

## Overview
This phase focused on elevating the brand's visual identity through high-end, minimalist animations inspired by Apple's design language. The goal was to move away from static sections towards a cohesive, narrative-driven landing page using GSAP.

## Technical Details

### GSAP Integration
- **Engine**: GSAP 3.x with `ScrollTrigger` and `@gsap/react`.
- **Component**: `src/components/marketing/scroll-reveal.tsx`
  - A versatile wrapper that applies scroll-triggered animations to any children.
  - Supports configurable directions (up, down, left, right), delays, and durations.
  - Uses `IntersectionObserver` principles via ScrollTrigger for high performance.

### Implementation Highlights
- **Hero Staggers**: The hero section uses staggered `ScrollReveal` components for the headline, subheadline, and CTA buttons, creating a "buttery-smooth" entry sequence.
- **Bento Grid Reveals**: Product feature cards in the bento grid use directional staggers (sliding in from left/right) to guide the user's eye as they scroll.
- **Optimized Performance**: 
  - Uses `will-change: transform, opacity` for GPU acceleration.
  - Minimalistic staggers ensure that animations don't distract from the core value proposition.

## Verification Results
- **Visual Audit**: Verified smooth frame rates (60fps) during scroll on desktop and mobile.
- **Accessibility**: Ensured that animations respect the `prefers-reduced-motion` media query.
- **Code Quality**: `ScrollReveal` component is reusable and clean, avoiding VDOM clashes with React 19.
