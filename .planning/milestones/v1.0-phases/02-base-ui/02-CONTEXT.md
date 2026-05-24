# Phase 2: Base UI & Landing Page (Theme Setup) - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the "Wow" factor Landing Page and Base layout structure. This includes configuring the Tailwind v4 and shadcn/ui theme, building a high-impact landing page hero with Anime.js, and structuring the Next.js App Router with secure route groups for marketing and application dashboards.

</domain>

<decisions>
## Implementation Decisions

### Paleta de Cores e Tema
- **D-01:** "Corporativo Moderno" focado em Dark Mode absoluto.
- **D-02:** Tons monocromáticos baseados em zinc ou slate do Tailwind v4 (fundo em zinc-950, bordas em zinc-800, textos em alto contraste).
- **D-03:** A cor de destaque será um azul corporativo vibrante ou branco puro (usados em botões ou badges sem poluir visualmente o Shadcn/ui).

### Estrutura da Landing Page
- **D-04:** Fluxo voltado para conversão: Hero Section -> Social Proof -> Grade de Features (Bento Grid) -> Pricing -> Bottom CTA.
- **D-05:** **Hero Section:** Título de alto impacto + Subtítulo técnico + CTA Duplo ("Começar Agora" e "Falar com Vendas").
- **D-06:** **Social Proof:** Faixa de logos de tecnologias ou integrações abaixo do hero para gerar autoridade.
- **D-07:** **Features:** Layout em Bento Grid asimétrico (destaque em arquitetura multi-tenant e segurança).
- **D-08:** **Pricing:** Tabela clara para planos de SaaS com Toggle interativo Mensal/Anual.
- **D-09:** **Bottom CTA:** Bloco final com apelo forte para a ação "Criar Conta / Nova Organização".

### Animação Hero com Anime.js
- **D-10:** Efeito profissional demonstrando "tecnologia de ponta e fluidez" (evitando que pareça um videogame).
- **D-11:** **Texto do Hero:** Entrance 'reveal' limpo e rápido, de baixo para cima.
- **D-12:** **Mockup de Dashboard Abstrato:** Pedaços da interface abstrata, renderizando em animação Stagger (cascata um após o outro), simulando compilamento e processamento de um sistema ultrarrápido.

### Layout Base do Dashboard (App)
- **D-13:** Barra lateral (Sidebar) colapsável à esquerda para não empilhar e quebrar layouts durante a navegação.
- **D-14:** **Tenant Switcher:** Localizado no topo da Sidebar através de um componente `Select` do Shadcn, permitindo a alternância imediata entre organizações/empresas, e mantendo espaço útil (à direita) totalmente destinado aos dados.

</decisions>

<canonical_refs>
## Canonical References

### UX e Arquitetura de Interface
- `.planning/ROADMAP.md` § Phase 2 — Phase objective and boundary constraints.
- `.planning/REQUIREMENTS.md` § UI-01, UI-02, UI-03 — Design requirements (Anime.js only for pure landing page UI element injection, Framer Motion for actual React component level UI, next.js App routing config).

</canonical_refs>

<specifics>
## Specific Ideas

- "O fundo em zinc-950 com textos em alto contraste e bordas sutis (zinc-800) transmite segurança e estabilidade (Enterprise)."
- "O efeito UAU não pode parecer videogame; tem que parecer tecnologia de ponta e fluidez."
- "A sidebar permite empilhar menus sem quebrar o layout."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-base-ui*
*Context gathered: 2026-04-16*
