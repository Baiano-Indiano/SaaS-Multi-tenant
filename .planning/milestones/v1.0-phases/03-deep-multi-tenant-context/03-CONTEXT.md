# Phase 3: Deep Multi-Tenant Context - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary
Build organization structure and database schema generation. Implement the creation of organizations, dynamic generation of tenant Postgres schemas (via Drizzle ORM pushing migrations), protect routes via Edge Middleware, and build the tenant switcher functionality.
</domain>

<decisions>
## Implementation Decisions

### Padrão de Nomenclatura dos Schemas no DB
- **D-01:** Utilizar o UUID da organização como base para o nome do schema (ex: `tenant_{uuid}`). Escolha feita por segurança, para evitar vazamento de informações ou colisões.

### UX do Seletor de Tenant (Switcher)
- **D-02:** O botão "Criar Nova Organização" vai ficar fixo no final do dropdown do Shadcn (padrão Vercel, Notion, Slack).
- **D-03:** A troca de tenant no componente switcher deve acontecer através de navegação imadiata (redirecionamento de base path).

### Tratamento de Acesso Indevido (Middleware)
- **D-04:** Haverá um redirecionamento limpo para `/selecionar-org` (ou Dashboard Global) quando uma tentativa de acesso esbarrar em um slug que o usuário não tem permissão para entrar, em vez de cuspir 403.

### Gatilho de Criação do Schema
- **D-05:** Criação do schema (Drizzle push/migrate trigger) será executada de forma **síncrona** nativamente na própria requisição de criação através de **Server Actions** no Next.js (simplificando infraestrutura sem worker jobs no momento).
</decisions>

<canonical_refs>
## Canonical References
- `.planning/ROADMAP.md` § Phase 3
- `.planning/REQUIREMENTS.md` § ORG-01, ORG-02, ORG-03
</canonical_refs>

<specifics>
## Specific Ideas
- A Sidebar de dashboard, importada da Fase 2, será conectada com dados vivos para prover a listagem de orgs do usuário.
- O botão 'Criar Nova Organização' no fim da lista serve exatamente a melhor prática de UX vista pela Vercel e Notion.
</specifics>

<deferred>
## Deferred Ideas
None — discussion stayed within phase scope.
</deferred>

---

*Phase: 03-deep-multi-tenant-context*
*Context gathered: 2026-04-16*
