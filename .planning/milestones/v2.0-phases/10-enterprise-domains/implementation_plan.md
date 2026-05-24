# Enterprise Domains & Organization Management

Este plano foca na infraestrutura necessária para suportar domínios customizados (Vercel Platforms) e na melhoria da experiência de troca de contexto entre organizações.

## User Review Required

> [!IMPORTANT]
> O arquivo `vercel.json` foi atualizado para suportar reescritas de domínio dinâmicas.

## Proposed Changes

### [Core]

#### [MODIFY] [vercel.json](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/vercel.json)
Configuração de reescritas para roteamento de domínios customizados.

### [Actions]

#### [NEW] [domains.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/actions/domains.ts)
Ações de servidor para gerenciar a adição e verificação de domínios customizados na Vercel.

#### [MODIFY] [org.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/actions/org.ts)
Melhorias na lógica de deleção e atualização de organizações.

### [UI]

#### [MODIFY] [org-switcher.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/org-switcher.tsx)
Novo design para o seletor de organizações com suporte a busca.

## Verification Plan

### Manual Verification
- Testar a criação de uma organização e a tentativa de vincular um domínio de teste.
- Verificar se a troca de organização via `OrgSwitcher` limpa o cache de navegação corretamente.
