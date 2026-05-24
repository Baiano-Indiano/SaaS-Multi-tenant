# Phase 33: Infrastructure Tooling & CLI - PLAN

## Goal
Build a professional internal CLI tool for managing tenants and organizations, using a unified interface with interactive prompts.

## Proposed Changes

### Dependencies
- [ ] Install `commander` and `@clack/prompts`.

### Entry Point
#### [NEW] [index.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/cli/index.ts)
- Initialize Commander program.
- Register `tenant` and `org` commands.
- Provide a default interactive mode if no subcommands are passed.

### Tenant Commands
#### [NEW] [tenant.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/cli/commands/tenant.ts)
- `list`: Show all organizations with their tenant schemas.
- `migrate`: Execute `createTenantSchema` logic for specific or all tenants.

### Organization Commands
#### [NEW] [org.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/cli/commands/org.ts)
- `list`: Show all organizations.
- `add-member`: Interactive prompt to select org, user (search), and role to add a member.
- `set-role`: Update a member's role in a specific tenant.

### Configuration
#### [MODIFY] [package.json](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/package.json)
- Add `"cli": "tsx --env-file=.env.local src/cli/index.ts"` script.

## Verification Plan

### Automated Verification
- Run `npm run cli -- --help` to verify command registration.
- Run `npm run cli tenant list` to verify DB connectivity.

### Manual Verification
- Test `npm run cli org add-member` interactively.
- Verify that changes are reflected in the database.
