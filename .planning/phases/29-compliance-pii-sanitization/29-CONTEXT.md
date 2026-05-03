# Phase 29: Compliance & PII Sanitization - Context

**Gathered:** 2026-05-03
**Status:** Retroactively Documented
**Source:** discuss-phase (retroactive)

<domain>
## Phase Boundary

Ensuring that sensitive user data (PII) and system secrets are not leaked in logs or monitoring. This phase hardens the Audit Log system and trace payloads against accidental exposure of secrets (MFA codes, session tokens, etc).
</domain>

<decisions>
## Implementation Decisions

### Audit Log Masking
- **Automatic Scrubbing**: Use `sanitizeAuditDetails` function in all `recordAuditLog` calls to recursively redact sensitive keys from the `details` payload.
- **Sensitive Keywords**: Blacklist includes `password`, `token`, `secret`, `session`, `backupcode`, `webhook`, `api_key`, `stripe`, `payment`, `card`, `2fa`, `mfa`.
- **IP Strategy**: Keep full IP address in the tenant-isolated Database for security forensics/compliance, as the DB is treated as the primary "Secure Vault".

### Trace & Exception Sanitization
- **Sentry Integration**: Link `beforeSend` in Sentry config to a central scrubbing utility to ensure that exceptions don't contain request bodies with passwords or session tokens.
- **Header Protection**: Always redact `Authorization` and `Cookie` headers in both internal logs and external monitoring tools.
</decisions>

<canonical_refs>
## Canonical References

- [GDPR Guidelines for Log Management](https://gdpr.eu/data-privacy-guide-for-log-management/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
</canonical_refs>

<specifics>
## Specific Ideas

- Ensure that `sanitizeAuditDetails` handles both JSON objects and raw strings.
- Audit logs are stored in the tenant-specific schema for isolation and compliance.
</specifics>

<deferred>
## Deferred Ideas

- Field-level encryption for specific audit log columns.
- Automatic PII detection using regex or AI for unstructured logs.
</deferred>
