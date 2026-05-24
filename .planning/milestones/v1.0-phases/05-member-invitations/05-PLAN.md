# Plan: Phase 05 - Member Invitations

## Objectives
Implement the invitation workflow to allow organization admins to invite team members to their specific tenant context.

## Requirements
- **INV-01**: Admin can generate invitation link.
- **INV-02**: Invites bound to schema/org.
- **INV-03**: User can accept and join.

## Proposed Changes
- Create `invitations` table in `public` schema.
- Implement `inviteMember` Server Action.
- Create `/invite/[id]` acceptance route.
- Handle token validation and automatic schema assignment on acceptance.

## Verification
- Manual flow: Create invite -> Copy link -> Open in new browser -> Accept -> Verify membership in UI.
