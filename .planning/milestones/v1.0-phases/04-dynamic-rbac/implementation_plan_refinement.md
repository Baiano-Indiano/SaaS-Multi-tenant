# Team Management & RBAC Refinement

Este plano documenta o refinamento do sistema de membros e permissões, garantindo que o fluxo de convites e as restrições de papéis (Roles) estejam operando sem falhas críticas identificadas durante o uso inicial.

## User Review Required

> [!WARNING]
> Algumas permissões padrão foram alteradas para serem mais restritivas.

## Proposed Changes

### [Access Control]

#### [MODIFY] [rbac.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/actions/rbac.ts)
Ajuste nas verificações de permissão para prevenir escalonamento de privilégios.

#### [MODIFY] [RoleDialog.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/rbac/RoleDialog.tsx)
Melhoria na UI de edição de permissões para maior clareza.

### [Members]

#### [MODIFY] [member.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/actions/member.ts)
Correção na expiração de convites e reenvio de e-mails.

#### [MODIFY] [InvitationsTable.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/members/InvitationsTable.tsx)
Adição de status visual para convites pendentes/expirados.

## Verification Plan

### Manual Verification
- Convidar um novo membro e aceitar o convite em modo anônimo.
- Tentar realizar uma ação proibida com um papel de "Visualizador" e confirmar que o sistema bloqueia.
