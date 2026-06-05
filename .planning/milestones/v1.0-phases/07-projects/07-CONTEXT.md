# Context: Phase 07 - Project Management

## Business Goal
Provide organizations with the ability to manage isolated work entities (Projects) within their dedicated tenant schema.

## Technical Context
- **Isolation Strategy**: Schema-per-tenant.
- **Access Pattern**: Unified Server Actions using `getTenantDb` helper.
- **Constraints**: Projects created in Org A must never be visible to Org B.

## Requirements
- **PROJ-01**: Secure CRUD for projects with tenant boundary enforcement.
