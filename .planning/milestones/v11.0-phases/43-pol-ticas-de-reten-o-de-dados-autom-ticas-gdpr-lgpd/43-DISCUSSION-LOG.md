# Phase 43: Políticas de Retenção de Dados Automáticas (GDPR/LGPD) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 43-pol-ticas-de-reten-o-de-dados-autom-ticas-gdpr-lgpd
**Areas discussed:** UI Integration, Exclusão de Logs, Valores Padrão, Janela e Execução

---

## UI Integration Point

| Option | Description | Selected |
|--------|-------------|----------|
| Option A | Add to existing Security Settings page | ✅ |
| Option B | Create new Privacy page | |

**Decision:** Option A
**Justificativa:** Integrar a nova configuração na página de segurança existente facilita o fluxo para o administrador sem sobrecarregar o menu lateral de navegação com uma nova aba.

---

## Exclusão de Logs

| Option | Description | Selected |
|--------|-------------|----------|
| Option A | Hard Delete (Deletar permanentemente no PostgreSQL) | ✅ |
| Option B | Anonimização (Limpar campos identificáveis, mantendo a linha) | |

**User's choice:** Option A
**Notes:** Exclusão física economiza custos com armazenamento, evita tabelas massivas e garante conformidade absoluta com o "direito ao esquecimento" da LGPD/GDPR.

---

## Valores Padrão & Granularidade

| Option | Description | Selected |
|--------|-------------|----------|
| Option A | Desativada por Padrão + Opt-in (Trava mínima de 7 dias) | ✅ |
| Option B | Ativada por padrão com 90 dias | |

**User's choice:** Option A
**Notes:** Retenção infinita por padrão evita deleção automática acidental sem consentimento expresso. A trava de 7 dias protege o administrador de erros humanos.

---

## Janela e Execução do Sweep

| Option | Description | Selected |
|--------|-------------|----------|
| Option A | Upstash QStash Diário (Endpoint serverless automatizado) | ✅ |
| Option B | Execução manual reativa | |

**User's choice:** Option A
**Notes:** Processo em background recorrente rodando diariamente fora do horário de pico garante escalabilidade de forma limpa.
