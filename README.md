# Gravity SaaS - Boilerplate Multi-Tenant

**Gravity SaaS** é um boilerplate *enterprise-ready* desenhado para acelerar a construção de aplicações SaaS modernas com foco em multilocação B2B (Multi-tenant).

Seu objetivo é ser robusto, seguro e com isolamento profundo de dados, mantendo um design minimalista e premium. O projeto agora se encontra na versão **v2.0**, com toda a base estrutural de autenticação, organização de *tenants*, controle de acesso e um robusto **Módulo de Produto-Led Growth (PLG) com Billing integrando ao Stripe** concluídos.

---

## 🚀 Funcionalidades da v2.0

- **Billing Módular & Webhooks (Stripe)**: Geração de sessoões de checkout (`client_reference_id`) aliada à uma listener server-side 100% blindada para capturar pagamentos da Stripe e espelhar assinaturas no BD.
- **Paywalls Contextuais (Freemium)**: Limitações integradas no Server Action! Caso uma organização atinja o limite do Payload Free (membros, acessos), um Modal sofisticado de upgrade bloqueia ações da org para converter novos assinantes.
- **Autenticação com Better-Auth**: Gestão de sessão fluida (E-mail/Senha). 
- **Suporte Multi-Tenant 1:1**: Isolamento estrutural de dados com abordagens *schema-per-tenant* através do Drizzle ORM.
- **Engine Dinâmico de RBAC**: Controle rígido e performático de Acesso Baseado em Cargos e Permissões. (Admin/Member).
- **Gestão de Convites**: Sistema end-to-end seguro para envio, aceitação ou cancelamento de membros em Organizações.
- **Integrações Assíncronas**: Ganchos de mock/integração preparados nativamente para **Resend** (Disparo de E-mails).
- **Hardening de UI (Next.js 15)**: Implementação de Boundaries para falhas visuais (`error.tsx`) e interatividade reativa otimizada (`loading.tsx`), prevenindo bloqueios do Client-side.
- **Real-time Notification Engine (SSE)**: Sistema de notificações persistente e performático utilizando Server-Sent Events e Upstash Redis como message broker. Garante atualizações instantâneas entre abas sem o overhead de WebSockets.
- **Tenant Analytics & Quota Enforcement**: Dashboards com indicadores de uso em tempo real (Projetos, Membros) e bloqueio preventivo (Soft-Block) baseado no plano contratado.
- **Playwright Estabilizado**: Ambiente pré-configurado contendo suítes automáticas *End-To-End* protegendo as rotas de acesso e garantindo ausência de regressões críticas.

---

## 🛠️ Stack Tecnológico

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) | Core, SSR (Server-Side Rendering) e Server Actions. |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) | Tipagem forte e prevenção contra vazamentos (strict bounds). |
| **Estilização** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Design UI minimalista, CSS Variables e Acessibilidade Radix. |
| **Animações** | [Framer Motion](https://www.framer.com/motion/) + [GSAP](https://gsap.com/) | Micro-interações otimizadas a nível VDOM e Hero animations. |
| **Database** | [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) | Persistência, TypeSafety de DB e Native Tenant Schemas. |
| **Auth** | [Better-Auth](https://better-auth.com/) | Extensibilidade, Session & Org Management. |
| **Testes (E2E)** | [Playwright](https://playwright.dev/) | Chromium / Webkit Automation & Smoke Testing. |

---

## 📦 Como rodar localmente

### 1. Requisitos
- Node.js (v20+ Recomendado)
- PostgreSQL (Local instanciado)

### 2. Configurações (`.env.local`)
Clone este repositório, instale dependências (`npm install`) e declare as chaves mínimas do ambiente:

```env
# URL do App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Drizzle & DB Auth Config
DATABASE_URL="postgresql://user:password@localhost:5432/gravitysaas"

# Disparos de E-mail (Opcional - Falha de fallback vai para o console.log local)
RESEND_API_KEY="re_..."

# Configurações do Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Rodando Scripts e Migrações
Após o BD conectado e criado na máquina, rode os pacotes core:

```bash
# Push Inicial de Schemas & Seed 
npm run db:push

# (Manutenção) Aplicar patches em schemas de tenants antigos
# Utilize caso adicione colunas novas no Tenant Schema após a criação de algumas orgs
npx tsx --env-file=.env.local src/scripts/fix-tenant-schemas.ts

## 💳 Faturamento (Stripe)

A integração com o Stripe já está configurada com produtos reais (em modo de teste). O sistema utiliza o fluxo de Checkout Session + Webhooks para sincronização de planos.

### Configuração
Certifique-se de que as seguintes variáveis estão no seu `.env.local`:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Testando Webhooks Localmente
Como os eventos do Stripe (ex: assinatura completada) ocorrem fora do seu computador, você precisa redirecioná-los para o seu localhost usando o [Stripe CLI](https://docs.stripe.com/stripe-cli):

1. Autentique o CLI: `stripe login`
2. Inicie o redirecionamento: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Copie o `whsec_...` gerado no console e coloque no seu `.env.local`.

### Manutenção de Planos
Os planos estão definidos em `src/lib/billing/plans.ts`. Ao adicionar novos planos no Stripe, atualize os `priceId` correspondentes neste arquivo.
# Inicializar Servidor de Desenvolvimento
npm run dev
```

## 🛤️ Roadmap - Futuras Versões
- [ ] Enterprise Domains (Vercel Platforms): Mapeamento de domínios customizados para clientes.
- [ ] Analytics Admin-facing: Dashboard master para supervisionar a rentabilidade total (MRR, Churn).

> Criado em parceria com a Infra de Multi-Tenant Assistants. Equipe de Produto.
