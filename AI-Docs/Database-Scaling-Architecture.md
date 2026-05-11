# Database Scaling: Pooling & Read Replicas

Arquitetura preparada para alta disponibilidade e escalabilidade horizontal de leitura no Drizzle ORM.

## Componentes

### 1. Connection Pooling
Utilizamos o driver `postgres-js` com suporte nativo a pooling.
- **Configuração**: Controlado via `DB_POOL_MAX` (default: 10) e `DB_IDLE_TIMEOUT`.
- **Singleton**: Os clientes são instanciados como singletons no `globalThis` (em desenvolvimento) ou no escopo do módulo (em produção) para evitar vazamento de conexões durante Hot Reloads.

### 2. Read Replicas
O sistema suporta roteamento inteligente de queries para réplicas de leitura.
- **Escrita/Primário**: Utiliza `DATABASE_URL`.
- **Leitura/Réplica**: Utiliza `READ_DATABASE_URL`. Se não definida, faz fallback automático para o banco primário.
- **Instâncias**:
  - `db`: Drizzle configurado para escrita/primário.
  - `readDb`: Drizzle configurado para leitura (pode apontar para o primário se não houver réplica).

## Utilização

### queries de Tenant com Read Replica
Para rotear queries de um tenant para a réplica (ex: Dashboard, Relatórios), utilize o parâmetro `mode`:

```typescript
// Exemplo no Dashboard
const logs = await getTenantDb(userId, orgId, async (tx) => {
  return await tx.select().from(auditLogs);
}, { mode: 'reader' });
```

### Administrative Bypass
```typescript
// Background jobs ou analytics pesados
await withAdminTenantDb(orgId, async (tx) => {
  // ...
}, { mode: 'reader' });
```

## Benefícios
- **Isolamento de Carga**: Queries pesadas de analytics não degradam a performance de operações críticas (pagamentos, cadastros).
- **Resiliência**: Fallback transparente caso a infraestrutura de réplica não esteja disponível ou configurada.
