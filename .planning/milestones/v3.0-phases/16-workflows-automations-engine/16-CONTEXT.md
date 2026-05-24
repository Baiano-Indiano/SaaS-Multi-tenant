# Phase 16: Workflows & Automations (Core Engine)

## 🎯 Goal
Implement a robust, serverless-friendly automation engine that connects system events to external webhooks using Upstash QStash.

## 🏗️ Architecture
- **Trigger**: System events (e.g., `project.created`) emitted via a central `emitEvent` hub.
- **Queue**: Upstash QStash for message queuing, retries, and asynchronous processing.
- **Action**: Webhook delivery (signed POST requests) handled by a dedicated API route.
- **UI**: Step-by-step vertical builder for creating and managing workflows.

## 🛠️ Implementation Details

### 1. Event Hub (`src/lib/events.ts`)
```typescript
export async function emitEvent(orgId: string, event: string, payload: any) {
  // 1. Log to Audit Table
  // 2. Query matching Webhooks
  // 3. Publish to QStash
}
```

### 2. QStash Infrastructure
- **Provider**: Upstash QStash.
- **Reason**: native HTTP retries, no 24/7 workers needed, scales with Vercel Edge.
- **Endpoint**: `/api/webhooks/qstash-handler`.

### 3. Workflow UI
- **Pattern**: Vertical step-by-step form.
- **Steps**:
  1. **Trigger**: Select from `project.created`, `member.invited`, `organization.invitation_accepted`.
  2. **Action**: `Send Webhook` (default for MVP).
  3. **Configure**: Enter Payload URL.

## ✅ Verification
- **E2E**: Create a project -> Observe Webhook arrival at destination via QStash.
- **Resilience**: Block destination URL -> Verify QStash retry logs in Upstash Console.
