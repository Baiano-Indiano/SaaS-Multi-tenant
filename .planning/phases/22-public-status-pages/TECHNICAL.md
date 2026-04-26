# Phase 22: Public Status Pages & Incident Management

## Overview
This phase introduces public-facing status pages for organizations, allowing them to communicate system health and incidents to their users. It also includes an administrative interface for managing components and reporting incidents.

## Technical Details

### Database Schema
Two new tables were added to the `lib/db/schema.ts`:
- `statusComponents`: Tracks the health of specific system parts (e.g., "API", "Dashboard").
  - `status`: `operational`, `degraded`, `partial_outage`, `major_outage`.
- `statusIncidents`: Tracks specific incidents over time.
  - `status`: `investigating`, `identified`, `monitoring`, `resolved`.
  - `severity`: `minor`, `major`, `critical`.

### Public Status Page
Located at `src/app/status/[orgSlug]/page.tsx`:
- Fetches organization details based on slug.
- Displays a high-level status summary (hero section).
- Lists all active status components and their current state.
- Shows a timeline of incidents from the last 30 days.
- Dynamic metadata for SEO and social sharing.

### Administrative UI
Integrated into the organization settings:
- `src/components/dashboard/settings/StatusSettings.tsx`:
  - CRUD for status components.
  - Incident reporting and updates.
  - Real-time preview link to the public page.

### Server Actions
Handled in `src/app/actions/status.ts`:
- `upsertStatusComponentAction`: Creates or updates a component.
- `deleteStatusComponentAction`: Removes a component.
- `createStatusIncidentAction`: Reports a new incident.
- `updateStatusIncidentAction`: Updates an ongoing incident.
- `deleteStatusIncidentAction`: Deletes an incident record.

### Security
- **Public Access**: The status page is publicly accessible without authentication.
- **Admin Access**: All server actions require `org:update` permission and valid organization session via `requirePermission` and `auth.api.getSession`.

## Verification Results
- **Linting**: Passed `npm run lint`.
- **UI/UX**: Verified responsive design and premium animations using Framer Motion.
- **RBAC**: Verified that only organization admins can modify status data.
