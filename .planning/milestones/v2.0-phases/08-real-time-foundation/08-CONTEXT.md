# Phase 08: Real-time Foundation (Upstash) - Context

**Gathered:** 2026-04-21
**Status:** In Discussion / Planning

<domain>
## Phase Boundary
Establish a serverless real-time messaging layer using Upstash Redis. Implement persistent notification storage in the database and a hybrid UI (Toasts + Notification Bell) to provide immediate feedback for both manual and system events (like Stripe webhooks).
</domain>

<decisions>
## Implementation Decisions

### Persistência de Dados
- **D-01:** Notificações são **Persistentes**. Serão salvas no banco de dados para garantir auditoria e histórico.
- **D-02:** Localização: Tabela unificada `public.notifications`. Isso permite consultar notificações de múltiplas organizações no mesmo Header sem trocar de esquema.

### User Experience (UX)
- **D-03:** Padrão Híbrido: Exibição de **Toasts instantâneos** (Sonner) para usuários logados, alimentando uma **Central de Notificações** (ícone de sino) no dashboard.
- **D-04:** A interface da central será baseada em Popover ou DropdownMenu do Shadcn para manter a agilidade.

### Arquitetura Real-time
- **D-05:** Infraestrutura: **Upstash Redis**. Escolhido por ser serverless, Edge-compatible e de baixa latência.
- **D-06:** Inscrição Dupla: O cliente se conecta a canais baseados em `userId` (privado) e `orgSlug` (colaborativo/tenant).

### Gatilhos de Alerta
- **D-07:** Integração de Webhooks: Disparar notificação de "Assinatura Confirmada" diretamente do webhook do Stripe (v1.0).
- **D-08:** Eventos de CRUD: Ações de criação de projetos ou novos membros dispararão eventos para o canal da organização.
</decisions>

<canonical_refs>
## Canonical References
- `.planning/ROADMAP.md` — Phase 08
- `.planning/REQUIREMENTS.md` — REK-01, REK-02
- `.planning/PROJECT.md` — Baseline SaaS architecture.
</canonical_refs>

<specifics>
## Specific Ideas
- O "Sininho" com badge vermelho é o gatilho psicológico central para engajamento no dashboard.
- Usar Upstash permite escalar para zero e simplifica o gerenciamento de conexões na Vercel Edge.
</specifics>

<deferred>
## Deferred Ideas
- Notificações por E-mail (Workflow complexo adiado para manter foco no Tempo Real).
</deferred>
