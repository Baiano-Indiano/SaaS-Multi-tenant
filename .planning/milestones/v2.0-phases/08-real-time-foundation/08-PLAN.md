---
phase: 08
name: Real-time Foundation (Upstash)
slug: real-time-foundation
status: completed
---

# Phase 08: Real-time Foundation (Upstash)

Establish the serverless real-time infrastructure using Upstash Redis Pub/Sub, SSE, and persistent notification storage.

## Plan 01: Infrastructure & Schema
**Goal:** Setup Upstash Redis and the `public.notifications` table.

- [ ] Install dependencies: `npm install @upstash/redis`
- [ ] Define `src/lib/db/schema/notifications.ts` with `userId`, `orgId`, `type`, `content`, `readAt`.
- [ ] Export the new schema in `src/lib/db/schema/index.ts`.
- [ ] Run `npx drizzle-kit push` to update the public schema.
- [ ] Create `src/lib/upstash.ts` for the Redis client.

## Plan 02: SSE Engine & Provider
**Goal:** Implement the Server-Sent Events stream and the client-side connector.

- [ ] Create `src/app/api/notifications/stream/route.ts` (SSE handler with Upstash Pub/Sub).
- [ ] Create `src/components/notifications/notification-provider.tsx` (Client component using `EventSource`).
- [ ] Integrate `NotificationProvider` into the root application layout.
- [ ] Verify the SSE connection in the browser console.

## Plan 03: UI & Integration
**Goal:** Build the Notification Bell and trigger alerts from events.

- [ ] Create `src/components/notifications/notification-bell.tsx` (Header component with unread count).
- [ ] Implement `src/app/api/cron/cleanup-notifications/route.ts` (30-day cleanup).
- [ ] Add trigger to `src/app/api/billing/webhook/route.ts` (Stripe success).
- [ ] Add trigger to Project creation Server Action.
- [ ] Final verification of the "Bell" reactive update.
