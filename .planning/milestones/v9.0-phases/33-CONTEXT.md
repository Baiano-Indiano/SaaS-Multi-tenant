# Phase 33: Infrastructure Tooling & CLI - CONTEXT

## Locked Decisions

### 1. Architecture: Unified CLI (Commander + Clack)
- **Engine:** `commander` for command routing and CLI flags (CI/CD compatibility).
- **Interface:** `@clack/prompts` for an interactive and high-quality developer experience in the terminal.
- **Entry Point:** `src/cli/index.ts`.
- **NPM Script:** `npm run cli`.

### 2. Authentication: Direct DB Access
- **Strategy:** Environment-based trust.
- **Source:** Uses `DATABASE_URL` from `.env.local` or the active environment.
- **Rationale:** If the user has access to the database credentials, they are already at the highest privilege level. No separate API keys or OIDC flows are needed for internal tooling.

### 3. Location: `src/cli/`
- **Path:** All CLI-related code will live in `src/cli/`.
- **Benefits:** Full access to TypeScript types, Drizzle ORM instances, and existing utility functions without path alias issues or compilation headaches.

## Component Breakdown

### Core CLI
- `src/cli/index.ts`: Program definition and command registration.
- `src/cli/prompts.ts`: Shared Clack-based UI utilities.

### Tenant Management (`cli/tenant`)
- `migrate`: Runs the schema creation/update logic across all tenants.
- `list`: Displays all active tenants and their schema names.
- `create`: Manually creates a new tenant schema for a given organization ID.

### Organization Management (`cli/org`)
- `list`: Lists all organizations and their metadata.
- `members`: Lists members of a specific organization.
- `add-member`: Command to link a user to an organization with a specific role.
- `set-role`: Update a user's role within a tenant.

## Dependencies to Add
- `commander`: Command-line interfaces made easy.
- `@clack/prompts`: Beautifully simple CLI prompts.
