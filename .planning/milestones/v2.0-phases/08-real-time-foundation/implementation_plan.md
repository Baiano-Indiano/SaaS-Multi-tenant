# Notifications Re-architecture (SSE + Redis Streams)

Este plano documenta a mudança fundamental no sistema de notificações em tempo real. Saímos de um modelo de Pub/Sub simples para o uso de Redis Streams (XADD/XREAD), garantindo que nenhuma notificação seja perdida durante flutuações de conexão e melhorando a estabilidade no Next.js (Edge/Node runtimes).

## User Review Required

> [!IMPORTANT]
> A conexão agora utiliza um loop de polling (XREAD BLOCK) no lado do servidor. O runtime da rota foi alterado para `nodejs` para suportar conexões persistentes mais longas com o Upstash.

## Proposed Changes

### [Backend]

#### [MODIFY] [stream/route.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/api/notifications/stream/route.ts)
Implementação do loop de leitura de streams com suporte a `heartbeat` para evitar timeouts de proxy/Vercel.

#### [MODIFY] [notifications.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/notifications.ts)
Alteração de `redis.publish` para `redis.xadd`.

### [Frontend]

#### [MODIFY] [notification-provider.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/notifications/notification-provider.tsx)
Melhoria no tratamento de erros de conexão SSE e reconexão automática.

## Verification Plan

### Automated Tests
- Verificar logs do servidor para confirmar o registro de `XREAD`.

### Manual Verification
- Abrir duas abas, disparar uma ação que gere notificação em uma e verificar o recebimento instantâneo na outra.
- Simular queda de rede e verificar se o provedor reconecta automaticamente.
