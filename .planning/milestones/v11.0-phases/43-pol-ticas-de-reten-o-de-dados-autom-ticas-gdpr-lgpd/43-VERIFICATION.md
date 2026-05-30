# Phase 43 Verification: Políticas de Retenção de Dados Automáticas (GDPR/LGPD)

## Automated Verification
- [ ] **Database Column**: Verify `dataRetentionDays` is added to organizations schema.
- [ ] **Permissions & Validation**: Verify server action enforces RBAC (`security:manage`) and minimum 7 days rule.
- [ ] **Secure Cron Sweep**: Verify `/api/cron/cleanup-logs` is protected and executes purge queries successfully on dynamic schemas.

## Manual Verification
- [ ] **UI Configurations Toggle**: Open Security settings, toggle Data Retention settings, test validation with 5 days (fails) and 10 days (passes), save and check toast feedback.
- [ ] **Background execution sweep**: Trigger `/api/cron/cleanup-logs` using Postman/curl and verify that expired audit logs are deleted from dynamic tenant tables.
