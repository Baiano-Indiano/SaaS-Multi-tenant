# Phase 27: Sentry APM & Observability - Summary

## Status: Complete
**Completed Date:** 2026-05-02

## Overview
Implemented full-stack observability using Sentry, covering Client, Server, and Edge runtimes. Established a "Secure Vault" principle for PII handling.

## Key Changes
- **Sentry SDK Setup**: Initialized `@sentry/nextjs` across all Next.js environments.
- **PII Scrubbing**: Implemented aggressive `beforeSend` logic in `sentry.*.config.ts` to redact passwords, tokens, and other sensitive fields before telemetry egress.
- **Proxy Tracing**: Integrated Sentry spans into `src/proxy.ts` to monitor auth, domain resolution, and i18n performance.
- **Tenant Context**: Automatically tagging errors with anonymous `tenant.id` for cross-schema debugging.

## Verification
- Verified error capture in Sentry Dashboard.
- Confirmed redaction of sensitive headers (Cookie, Authorization) in captured breadcrumbs.
- Validated performance traces for API v1 auth flow.
