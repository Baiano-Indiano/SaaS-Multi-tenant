# GSAP Animation System Migration

Este plano documenta a migração do sistema de animações da Landing Page de Anime.js para GSAP, garantindo melhor performance, integração com React (através de `gsap.context()`) e suporte a sequências complexas no Dashboard.

## User Review Required

> [!IMPORTANT]
> A biblioteca `animejs` será removida das dependências em favor do `gsap` e `@gsap/react`.
> As animações agora seguem o padrão corporativo/elegante (mais lentas e suaves).

## Proposed Changes

### [Animations]

#### [NEW] [animated-table-body.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/animations/animated-table-body.tsx)
Criação de um componente wrapper para animar as linhas de tabelas (stagger reveal) usando GSAP.

#### [MODIFY] [hero-graphic.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/marketing/hero-graphic.tsx)
Substituição completa do motor Anime.js pelo GSAP. Uso de `gsap.context()` para garantir que as animações sejam limpas corretamente quando o componente for desmontado, prevenindo memory leaks.

#### [MODIFY] [page.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/(marketing)/page.tsx)
Atualização de comentários e ajustes leves para acomodar o novo componente gráfico.

## Verification Plan

### Automated Tests
- Verificar se o build passa após a remoção do `animejs`.
- `npm run lint` para garantir que não há imports órfãos.

### Manual Verification
- Visualizar a landing page e confirmar se as animações de "stagger" e "pulse" estão suaves e sem interrupções.
- Navegar para fora da página e voltar para garantir que o `gsap.context` está limpando os estados.
