# Phase 16: Workflows & Automations Engine (Retroactive Plan)

## Goal
Implement the core engine for workflows and automations, providing an event-based trigger system and background delivery service.

## Context
This phase was implemented directly in the source code outside of the GSD planning workflow. This retroactive plan documents the changes to align the project with the GSD framework.

## Implementation Details

### Workflows System
- `src/components/settings/workflows/`: UI components for managing workflows.
- `src/app/actions/workflows.ts`: Server actions for workflow CRUD.
- `src/lib/events.ts`: Event definitions for triggers (e.g., "On Member Joined").
- `src/lib/redis.ts`: Infrastructure logic to handle queuing or workflow execution via Upstash.

## Status
- [x] Implemented
- [x] Retroactively Documented
