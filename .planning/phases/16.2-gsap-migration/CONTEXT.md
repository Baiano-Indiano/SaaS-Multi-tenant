# Phase 16.2 Context: GSAP Migration

## Core Decisions
1. **Migration from Framer Motion to GSAP**
   - **Decision**: Standardize complex UI animations to use GSAP where Framer Motion falls short or causes VDOM clashes.
   - **Rationale**: Increases animation performance and unlocks advanced scroll-based triggering.

## Technical Baseline
- **Libraries**: `gsap` installed.
- **Hooks**: Integration of `useGSAP` in React components.
