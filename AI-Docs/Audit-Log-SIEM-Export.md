# SIEM Audit Log Export

O sistema de exportação de logs de auditoria permite que organizações exportem seus dados de segurança para ferramentas externas de análise (Splunk, Datadog, etc) via buckets compatíveis com S3.

## Arquitetura

### 1. Pipeline de Exportação
- **Trigger**: Cron job diário (`/api/cron/audit-export`).
- **Escopo**: Logs das últimas 24 horas por organização.
- **Formato**: Flat JSON (Root-level payload) para compatibilidade universal com SIEMs.

### 2. Segurança de Dados
- **AES-256-GCM**: Credenciais S3 (Access Keys) são criptografadas em repouso.
- **Key Derivation**: Utiliza `scrypt` para derivar uma chave de 32 bytes a partir da `ENCRYPTION_KEY` definida no ambiente.
- **Tenant Isolation**: O exportador utiliza `withAdminTenantDb` para garantir que os logs sejam lidos apenas do schema correto da organização.

## Configuração S3
Os clientes podem configurar os seguintes parâmetros:
- `Bucket Name`
- `Region`
- `Endpoint URL` (Opcional - para R2, MinIO, Spaces)
- `Access Key ID` (Criptografado)
- `Secret Access Key` (Criptografado)

## Exemplo de Payload (SIEM Optimized)
```json
{
  "timestamp": "2024-05-10T18:00:00Z",
  "event_id": "log_123",
  "tenant_id": "org_abc",
  "actor_name": "John Doe",
  "action": "user.login",
  "resource_type": "auth",
  "ip_address": "127.0.0.1",
  "details": { ... }
}
```
