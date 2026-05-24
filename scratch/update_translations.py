import json
import os

def update_json(filepath, lang):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Update Marketing
    data["Marketing"]["brandName"] = "SaaS Multi-tenant"
    data["Marketing"]["companies"] = {
        "acme": "Acme Corp",
        "globex": "Globex",
        "soylent": "Soylent",
        "initech": "Initech",
        "umbrella": "Umbrella"
    }

    # 2. Update Auth
    if "Auth" in data:
        if lang == "en":
            data["Auth"]["enterpriseSSOActive"] = "Enterprise SSO Active"
            data["Auth"]["corporateAccountNotice"] = "Log in with your corporate account from {domain}"
            data["Auth"]["usePassword"] = "Use password"
        else:
            data["Auth"]["enterpriseSSOActive"] = "Enterprise SSO Ativo"
            data["Auth"]["corporateAccountNotice"] = "Faça login com sua conta corporativa de {domain}"
            data["Auth"]["usePassword"] = "Usar senha"

    # 3. Update Dashboard
    if "Dashboard" in data:
        if lang == "en":
            data["Dashboard"]["noActiveOrgTitle"] = "No Active Organization"
            data["Dashboard"]["noActiveOrgDesc"] = "Please select or create an organization to access your command center."
            data["Dashboard"]["noRecentActivity"] = "No recent activity"
            data["Dashboard"]["diagnostics"] = {
                "requestInspector": "Request Inspector",
                "active": "Active",
                "apiSandbox": "API Sandbox",
                "cacheHitRate": "Cache Hit Rate",
                "securityScan": "Security Scan",
                "passed": "Passed"
            }
            data["Dashboard"]["trafficMap"] = {
                "globalTraffic": "Global Traffic",
                "liveAuditStream": "Live Audit Stream v4",
                "activeNodes": "Active Nodes",
                "requestsPerMinute": "Requests/m",
                "latency": "Latency: "
            }
            data["Dashboard"]["infraHealth"] = {
                "title": "Infra Health",
                "systemOperational": "System Operational",
                "latencyTrend": "Latency Trend (20m)",
                "avg": "Avg: ",
                "cpuLoad": "CPU Load",
                "ramUsage": "RAM Usage"
            }
            data["Dashboard"]["logStream"] = {
                "systemEvents": "System Events",
                "awaitingEvents": "Awaiting events..."
            }
            data["Dashboard"]["securityTerminal"] = {
                "logHeader": "SEC_AUDIT_LOG_V2.0",
                "packetsCaptured": "Packets Captured",
                "threatLevel": "Threat Level",
                "low": "Low",
                "inspectPacket": "Inspect Packet: ",
                "rawJsonPayload": "RAW_JSON_PAYLOAD",
                "awaitingSelection": "Awaiting Packet Selection",
                "selectionDescription": "Select a security trace from the sidebar to begin inspection",
                "systemOperational": "System Operational"
            }
            data["Dashboard"]["technicalHeader"] = {
                "systemOperational": "System Operational",
                "productionVersion": "Production-v4.2",
                "tenantDatabase": "Tenant_Isolated_Postgres",
                "normal": "Normal"
            }
            data["Dashboard"]["usageQuotas"] = {
                "planUsage": "Plan Usage",
                "activeProjects": "Active Projects",
                "teamMembers": "Team Members"
            }
        else:
            data["Dashboard"]["noActiveOrgTitle"] = "Nenhuma Organização Ativa"
            data["Dashboard"]["noActiveOrgDesc"] = "Por favor, selecione ou crie uma organização para acessar sua central de comando."
            data["Dashboard"]["noRecentActivity"] = "Nenhuma atividade recente"
            data["Dashboard"]["diagnostics"] = {
                "requestInspector": "Inspetor de Requisições",
                "active": "Ativo",
                "apiSandbox": "Sandbox da API",
                "cacheHitRate": "Taxa de Hit do Cache",
                "securityScan": "Varredura de Segurança",
                "passed": "Aprovado"
            }
            data["Dashboard"]["trafficMap"] = {
                "globalTraffic": "Tráfego Global",
                "liveAuditStream": "Stream de Auditoria ao Vivo v4",
                "activeNodes": "Nós Ativos",
                "requestsPerMinute": "Requisições/m",
                "latency": "Latência: "
            }
            data["Dashboard"]["infraHealth"] = {
                "title": "Saúde da Infra",
                "systemOperational": "Sistema Operacional",
                "latencyTrend": "Tendência de Latência (20m)",
                "avg": "Média: ",
                "cpuLoad": "Carga de CPU",
                "ramUsage": "Uso de RAM"
            }
            data["Dashboard"]["logStream"] = {
                "systemEvents": "Eventos do Sistema",
                "awaitingEvents": "Aguardando eventos..."
            }
            data["Dashboard"]["securityTerminal"] = {
                "logHeader": "SEC_AUDIT_LOG_V2.0",
                "packetsCaptured": "Pacotes Capturados",
                "threatLevel": "Nível de Ameaça",
                "low": "Baixo",
                "inspectPacket": "Inspecionar Pacote: ",
                "rawJsonPayload": "RAW_JSON_PAYLOAD",
                "awaitingSelection": "Aguardando Seleção de Pacote",
                "selectionDescription": "Selecione um rastreamento de segurança na barra lateral para iniciar a inspeção",
                "systemOperational": "Sistema Operacional"
            }
            data["Dashboard"]["technicalHeader"] = {
                "systemOperational": "Sistema Operacional",
                "productionVersion": "Production-v4.2",
                "tenantDatabase": "Tenant_Isolated_Postgres",
                "normal": "Normal"
            }
            data["Dashboard"]["usageQuotas"] = {
                "planUsage": "Uso do Plano",
                "activeProjects": "Projetos Ativos",
                "teamMembers": "Membros da Equipe"
            }

    # 4. Update InviteFlow
    if "InviteFlow" in data:
        if lang == "en":
            data["InviteFlow"]["invalidOrExpiredTitle"] = "Invalid or Expired Invitation"
            data["InviteFlow"]["invalidOrExpiredDesc"] = "This invitation no longer exists or has already been processed."
            data["InviteFlow"]["backToHome"] = "Back to Home"
            data["InviteFlow"]["brandName"] = "Antigravity Multi-Tenant"
            data["InviteFlow"]["roleLabel"] = "Role:"
            data["InviteFlow"]["invalidTitle"] = "Invalid Invitation"
            data["InviteFlow"]["backToSite"] = "Back to Site"
            data["InviteFlow"]["invitedTo"] = "{name} invited you to"
            data["InviteFlow"]["termsNotice"] = "By joining, you agree to the terms of use and privacy policies of the organization."
            data["InviteFlow"]["roleErrorDesc"] = "The context of this invitation has been modified by the administration. Please request a new access."
        else:
            data["InviteFlow"]["invalidOrExpiredTitle"] = "Convite Inválido ou Expirado"
            data["InviteFlow"]["invalidOrExpiredDesc"] = "Este convite não existe mais ou já foi processado."
            data["InviteFlow"]["backToHome"] = "Voltar para o início"
            data["InviteFlow"]["brandName"] = "Antigravity Multi-Tenant"
            data["InviteFlow"]["roleLabel"] = "Cargo:"
            data["InviteFlow"]["invalidTitle"] = "Convite Inválido"
            data["InviteFlow"]["backToSite"] = "Voltar para o site"
            data["InviteFlow"]["invitedTo"] = "{name} convidou você para"
            data["InviteFlow"]["termsNotice"] = "Ao ingressar, você concorda com os termos de uso e políticas de privacidade da organização."
            data["InviteFlow"]["roleErrorDesc"] = "O contexto deste convite foi alterado pela administração. Por favor, solicite um novo acesso."

    # 5. Add new sections/namespaces if not present
    if lang == "en":
        data["Errors"] = {
            "failedToLoad": "Failed to load content",
            "somethingWentWrong": "Something went wrong",
            "accessRestricted": "Access Restricted",
            "rolesManage": "roles:manage",
            "tryAgain": "Try again",
            "encounterProblem": "We encountered a problem loading this section.",
            "criticalError": "A critical error occurred. If this persists, please contact support."
        }
        data["StatusPage"] = {
            "components": "Components",
            "updatedRealTime": "Updated in real-time",
            "noComponents": "No components currently monitored.",
            "incidentHistory": "Incident History",
            "noIncidents": "No incidents recorded in the last 30 days.",
            "poweredBy": "Powered by",
            "brandName": "ANTIGRAVITY",
            "systemStatus": "System Status",
            "allSystemsOperational": "All systems operational",
            "criticalInstability": "Critical Instability Detected",
            "partialInstability": "Partial Instability in Some Systems",
            "noIssues30Days": "No issues reported in the last 30 days.",
            "teamWorkingOnResolve": "Our technical team is already aware and working on a resolution.",
            "operational": "Operational",
            "degradedPerformance": "Degraded Performance",
            "partialOutage": "Partial Outage",
            "majorOutage": "Major Outage",
            "unknown": "Unknown"
        }
        data["SentryExample"] = {
            "title": "sentry-example-page",
            "throwError": "Throw Sample Error",
            "errorSent": "Error sent to Sentry."
        }
        data["SSOSettings"] = {
            "securityTitle": "Security",
            "type": "Type",
            "txt": "TXT",
            "hostName": "Host / Name",
            "valueContent": "Value / Content",
            "noDomains": "No domains",
            "googleWorkspace": "Google Workspace",
            "clientId": "Client ID",
            "clientSecret": "Client Secret",
            "microsoftEntraId": "Microsoft Entra ID",
            "applicationClientId": "Application (Client) ID",
            "issuerTenantId": "Issuer / Directory (Tenant) ID",
            "strictSecurityEnforced": "Strict Organizational Security Enforced",
            "verified": "verified"
        }
        data["StatusSettings"] = {
            "live": "Live",
            "components": "Components",
            "identification": "Identification",
            "shortDescription": "Short Description",
            "currentStatus": "Current Status",
            "operational": "Operational",
            "degradedPerformance": "Degraded Performance",
            "partialOutage": "Partial Outage",
            "majorOutage": "Major Outage",
            "everythingQuiet": "Everything is quiet here",
            "addComponentInstruction": "Add your first component to start monitoring your system health.",
            "noDescription": "No description",
            "incidents": "Incidents",
            "whatIsHappening": "What is happening?",
            "impact": "Impact",
            "minorImpact": "Minor (Observational)",
            "majorImpact": "Major (Partial)",
            "currentPhase": "Current Phase",
            "investigating": "Investigating",
            "identified": "Identified",
            "monitoring": "Monitoring",
            "resolved": "Resolved",
            "noActiveIncidents": "No active incidents detected. All systems operational.",
            "removeComponent": "Remove Component?",
            "removeIncident": "Remove Incident?"
        }
        data["Notifications"] = {
            "title": "Notifications",
            "none": "No notifications yet."
        }
        data["RBAC"] = {
            "deleteRole": "Delete Role",
            "roles": "Roles",
            "accessRestricted": "Access Restricted",
            "accessRestrictedDesc": "Your current role does not have the roles:manage permission required to view or modify roles.",
            "rolesManage": "roles:manage",
            "title": "Roles & Permissions",
            "description": "Configure access levels for your organization. System roles are fixed defaults, while custom roles can be tailored to your specific workflow.",
            "createCustomRole": "Create Custom Role"
        }
        data["Settings"]["connectivity"]["integrationsSection"] = {
            "dominiosEnterprise": "Enterprise Domains",
            "domainsDescription": "Configure and manage custom domains for your organization.",
            "statusPage": "Status Page",
            "statusPageDescription": "Configure and manage system status transparency for your end users.",
            "automaticFormatting": "Automatic Formatting",
            "activeConnections": "Active Connections",
            "availableIntegrations": "Available Integrations",
            "slack": "Slack",
            "slackDesc": "Real-time team notifications via Block Kit.",
            "discord": "Discord",
            "discordDesc": "Rich embeds for community and dev channels.",
            "customWebhook": "Custom Webhook",
            "customWebhookDesc": "Coming soon: Raw JSON payloads."
        }
        data["Settings"]["integrations"]["connectSlack"] = "Connect Slack"
        
        # Playground subkeys
        data["Playground"]["sandbox"] = "API Sandbox"
        data["Playground"]["endpoints"] = "Endpoints"
        data["Playground"]["responseBody"] = "RESPONSE_BODY"
        data["Playground"]["executingProbe"] = "EXECUTING_PROBE..."
        data["Playground"]["readyForExecution"] = "READY_FOR_EXECUTION"
        data["Playground"]["runDiagnostic"] = "RUN DIAGNOSTIC"
        data["Playground"]["telemetryDescription"] = "This operation executes a real-time probe on the specified subsystem and returns a detailed telemetry payload."
        data["Playground"]["endpointPingName"] = "System Ping"
        data["Playground"]["endpointPingDesc"] = "Check global edge latency"
        data["Playground"]["endpointDbName"] = "Database Health"
        data["Playground"]["endpointDbDesc"] = "Verify connection pool status"
        data["Playground"]["endpointCacheName"] = "Cache Diagnostics"
        data["Playground"]["endpointCacheDesc"] = "Analyze memory and hit rate"
    else:
        data["Errors"] = {
            "failedToLoad": "Falha ao carregar o conteúdo",
            "somethingWentWrong": "Algo deu errado",
            "accessRestricted": "Acesso Restrito",
            "rolesManage": "roles:manage",
            "tryAgain": "Tentar novamente",
            "encounterProblem": "Encontramos um problema ao carregar esta seção.",
            "criticalError": "Ocorreu um erro crítico. Se isso persistir, entre em contato com o suporte."
        }
        data["StatusPage"] = {
            "components": "Componentes",
            "updatedRealTime": "Atualizado em tempo real",
            "noComponents": "Nenhum componente monitorado no momento.",
            "incidentHistory": "Histórico de Incidentes",
            "noIncidents": "Nenhum incidente registrado nos últimos 30 dias.",
            "poweredBy": "Powered by",
            "brandName": "ANTIGRAVITY",
            "systemStatus": "Status do Sistema",
            "allSystemsOperational": "Todos os sistemas operacionais",
            "criticalInstability": "Instabilidade Crítica Detectada",
            "partialInstability": "Instabilidade Parcial em Alguns Sistemas",
            "noIssues30Days": "Nenhum problema reportado nos últimos 30 dias.",
            "teamWorkingOnResolve": "Nossa equipe técnica já está ciente e trabalhando na resolução.",
            "operational": "Operacional",
            "degradedPerformance": "Performance Degradada",
            "partialOutage": "Instabilidade Parcial",
            "majorOutage": "Instabilidade Crítica",
            "unknown": "Desconhecido"
        }
        data["SentryExample"] = {
            "title": "sentry-example-page",
            "throwError": "Disparar Erro de Exemplo",
            "errorSent": "Erro enviado para o Sentry."
        }
        data["SSOSettings"] = {
            "securityTitle": "Segurança",
            "type": "Tipo",
            "txt": "TXT",
            "hostName": "Host / Nome",
            "valueContent": "Valor / Conteúdo",
            "noDomains": "Nenhum domínio",
            "googleWorkspace": "Google Workspace",
            "clientId": "Client ID",
            "clientSecret": "Client Secret",
            "microsoftEntraId": "Microsoft Entra ID",
            "applicationClientId": "Application (Client) ID",
            "issuerTenantId": "Issuer / Directory (Tenant) ID",
            "strictSecurityEnforced": "Segurança Organizacional Estrita Imposta",
            "verified": "verificado"
        }
        data["StatusSettings"] = {
            "live": "Ao Vivo",
            "components": "Componentes",
            "identification": "Identificação",
            "shortDescription": "Descrição curta",
            "currentStatus": "Status Atual",
            "operational": "Operacional",
            "degradedPerformance": "Performance Degradada",
            "partialOutage": "Instabilidade Parcial",
            "majorOutage": "Instabilidade Crítica",
            "everythingQuiet": "Tudo em silêncio por aqui",
            "addComponentInstruction": "Adicione seu primeiro componente para começar a monitorar a saúde do seu sistema.",
            "noDescription": "Sem descrição",
            "incidents": "Incidentes",
            "whatIsHappening": "O que está acontecendo?",
            "impact": "Impacto",
            "minorImpact": "Menor (Observação)",
            "majorImpact": "Maior (Parcial)",
            "currentPhase": "Fase Atual",
            "investigating": "Investigando",
            "identified": "Identificado",
            "monitoring": "Monitorando",
            "resolved": "Resolvido",
            "noActiveIncidents": "Nenhum incidente ativo detectado. Todos os sistemas operando normalmente.",
            "removeComponent": "Remover Componente?",
            "removeIncident": "Remover Incidente?"
        }
        data["Notifications"] = {
            "title": "Notificações",
            "none": "Nenhuma notificação ainda."
        }
        data["RBAC"] = {
            "deleteRole": "Excluir Cargo",
            "roles": "Cargos",
            "accessRestricted": "Acesso Restrito",
            "accessRestrictedDesc": "Seu cargo atual não tem a permissão roles:manage necessária para visualizar ou modificar cargos.",
            "rolesManage": "roles:manage",
            "title": "Cargos e Permissões",
            "description": "Configure os níveis de acesso para sua organização. Os cargos do sistema são padrões fixos, enquanto os cargos personalizados podem ser adaptados ao seu fluxo de trabalho específico.",
            "createCustomRole": "Criar Cargo Personalizado"
        }
        data["Settings"]["connectivity"]["integrationsSection"] = {
            "dominiosEnterprise": "Domínios Enterprise",
            "domainsDescription": "Configure e gerencie domínios customizados para sua organização.",
            "statusPage": "Página de Status",
            "statusPageDescription": "Gerencie a transparência do seu sistema para seus usuários finais.",
            "automaticFormatting": "Formatação Automática",
            "activeConnections": "Conexões Ativas",
            "availableIntegrations": "Integrações Disponíveis",
            "slack": "Slack",
            "slackDesc": "Notificações de equipe em tempo real via Block Kit.",
            "discord": "Discord",
            "discordDesc": "Rich embeds para canais de comunidade e desenvolvedores.",
            "customWebhook": "Webhook Personalizado",
            "customWebhookDesc": "Em breve: Payloads JSON puros."
        }
        data["Settings"]["integrations"]["connectSlack"] = "Conectar Slack"
        
        # Playground subkeys
        data["Playground"]["sandbox"] = "Sandbox da API"
        data["Playground"]["endpoints"] = "Endpoints"
        data["Playground"]["responseBody"] = "RESPONSE_BODY"
        data["Playground"]["executingProbe"] = "EXECUTING_PROBE..."
        data["Playground"]["readyForExecution"] = "READY_FOR_EXECUTION"
        data["Playground"]["runDiagnostic"] = "RUN DIAGNOSTIC"
        data["Playground"]["telemetryDescription"] = "Esta operação executa uma sonda em tempo real no subsistema especificado e retorna uma carga útil de telemetria detalhada."
        data["Playground"]["endpointPingName"] = "Ping do Sistema"
        data["Playground"]["endpointPingDesc"] = "Verificar latência global de borda"
        data["Playground"]["endpointDbName"] = "Saúde do Banco de Dados"
        data["Playground"]["endpointDbDesc"] = "Verificar status do pool de conexões"
        data["Playground"]["endpointCacheName"] = "Diagnósticos de Cache"
        data["Playground"]["endpointCacheDesc"] = "Analisar memória e taxa de acertos"

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

update_json('messages/en.json', 'en')
update_json('messages/pt.json', 'pt')
print("Successfully updated with Playground keys")
