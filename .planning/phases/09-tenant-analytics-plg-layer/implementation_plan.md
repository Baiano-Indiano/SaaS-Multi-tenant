# Tenant Analytics & Dashboard Enhancement

Este plano documenta a expansão do Dashboard para incluir visualizações de analytics em tempo real, cotas de uso por tenant e um feed de atividades centralizado. O objetivo é fornecer transparência administrativa e dados acionáveis para os gestores de cada organização.

## User Review Required

> [!NOTE]
> Os gráficos utilizam o novo componente `OverviewChart` que é otimizado para renderização no lado do cliente com dados pré-buscados no servidor.

## Proposed Changes

### [Dashboard]

#### [NEW] [activity-feed.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/dashboard/activity-feed.tsx)
Feed de eventos recentes da organização com ícones contextuais.

#### [NEW] [dashboard-client.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/dashboard/dashboard-client.tsx)
Wrapper de cliente para orquestrar o estado e animações iniciais do dashboard.

#### [NEW] [overview-chart.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/dashboard/overview-chart.tsx)
Componente de gráfico de área para visualização de métricas históricas.

#### [MODIFY] [AnalyticsWidgets.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/dashboard/AnalyticsWidgets.tsx)
Adição de indicadores de progresso de uso (membros/projetos) baseados no plano da organização.

## Verification Plan

### Automated Tests
- Verificar se os componentes renderizam corretamente sem dados (empty state).

### Manual Verification
- Acessar o dashboard de uma organização e verificar se o gráfico e os widgets carregam as informações do tenant correto.
