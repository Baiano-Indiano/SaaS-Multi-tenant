# Technical Documentation - Phase 21: Enterprise SSO & JIT Provisioning

## Overview
Phase 21 implements Enterprise Single Sign-On (SSO) using Better-Auth's SSO plugin, supporting OIDC and SAML providers (specifically Google Workspace and Microsoft Entra ID). It also includes Just-In-Time (JIT) provisioning to automatically onboard users from verified domains.

## Components

### Auth Configuration (`src/lib/auth/index.ts`)
- **SSO Plugin**: Configured with a dynamic `getProvider` lookup.
- **Provider Lookup**: Splits the user's email domain and matches it against `organizationDomains` (where `isVerified: true`).
- **JIT Hook**: An `after` hook in the auth middleware intercepts `sso/callback`. If the user's domain is verified but they aren't a member, they are automatically added to the `members` table with the `member` role.

### Auth UI (`src/components/auth/AuthForm.tsx`)
- **Enterprise SSO Toggle**: Allows users to switch to the SSO login flow.
- **SSO Login**: Users enter their corporate email, and the system redirects them to their IdP based on the domain lookup.
- **Animation**: Uses Framer Motion for smooth transitions between standard and SSO forms.

### SSO Settings (`src/components/dashboard/settings/SSOSettings.tsx`)
- **Domain Management**: Allows admins to add and verify domains via DNS TXT records.
- **DNS Verification**: Uses a `gravity-verification=<token>` TXT record.
- **IdP Configuration**: UI for configuring Client ID, Client Secret, and Issuer for Google and Microsoft.
- **Premium Design**: Uses Framer Motion staggers and a clean, enterprise-grade layout.

### Server Actions (`src/app/actions/sso.ts`)
- `addDomainAction`: Adds a new domain to the organization.
- `verifyDomainAction`: Triggers DNS verification.
- `deleteDomainAction`: Removes a domain.
- `updateSSOConfigAction`: Creates or updates SSO configurations for providers.

### DNS Utility (`src/lib/sso/dns.ts`)
- `verifyDomainTXT`: Flatens DNS records and checks for the verification token.
- `normalizeDomain`: Removes protocols and whitespace from domains.

## Security Considerations
- **Domain Verification**: SSO is only enabled for domains that have been verified via DNS.
- **Tenant Isolation**: SSO configurations and domains are scoped to the organization ID.
- **JIT Safety**: Only users from verified domains are provisioned.

## Dependencies
- `better-auth`: Core authentication library.
- `drizzle-orm`: Database access.
- `dns`: Node.js built-in module for verification.
- `framer-motion`: UI animations.
