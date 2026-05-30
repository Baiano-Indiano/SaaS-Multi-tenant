# Phase 44 Context: Smart Anomaly Detection & Alertas

This context document locks down the architectural decisions and scope of implementation for Phase 44 (Smart Anomaly Detection & Alertas) based on the user preferences aligned during the discussion.

---

## 🔒 Decisions & Constraints

### 1. MFA Failures Spikes (Real-time Redis Counters)
- **Mechanism:** Tentativas incorretas de verificação de TOTP ou Backup Code serão interceptadas e contabilizadas no Redis.
- **Data Structure:** Incrementaremos duas chaves temporais no Redis:
  - Janela curta: `org:${orgId}:mfa_failures_5m:${current_minute}` com expiração de 2 horas.
  - Janela longa (limiar secundário): `org:${orgId}:mfa_failures_24h` com expiração de 24 horas.
- **Thresholds:** Um pico de anomalia de MFA é sinalizado se:
  - O número de falhas acumuladas nos últimos 5 minutos exceder **10 falhas**.
  - O número de falhas nas últimas 24 horas exceder **30 falhas**.
- **Context Resolution:** O endpoint ou hook de verificação 2FA identificará a organização associada ao usuário para atribuir as falhas ao tenant correto.

### 2. Webhook Consumption Surges (Async Postgres Cron Scan)
- **Mechanism:** Uma rota de cron assíncrona `/api/cron/anomaly-detector` rodará a cada **15 minutos** para auditar a saúde de webhooks de todas as organizações.
- **Analysis:** 
  - Consultará o banco de dados Postgres (`webhook_delivery`) para obter a contagem de entregas de webhooks na última hora ($A$) e a média por hora nas últimas 24 horas ($B$).
  - O surto (surge) será disparado se $A > 3 \times B$ (aumento de >300% em relação à média móvel) e $A$ for superior a um limiar mínimo de segurança de **50 entregas/hora** (evitando falsos-positivos em volumes baixos).

### 3. Alert Rules & Recipients
- **Recipients:** Os e-mails de alerta serão enviados para todos os membros que possuem o cargo `admin` ou `owner` no tenant afetado.
- **Recipient Fallback:** Se a organização for órfã ou não possuir nenhum admin/owner ativo, o e-mail de alerta será encaminhado para a equipe interna de segurança/suporte em `security@saas-starter.internal`.
- **Alert Medium:** E-mails de alerta de segurança formatados enviados via Resend (`sendSecurityAlertEmail` ou utilitário equivalente).
- **Cooldown:** Impor um cooldown estrito no Redis de **30 minutos** por tipo de alerta por organização (`org:${orgId}:anomaly_cooldown:${type}`) para prevenir spam de e-mails em rajadas de ataques.
- **Audit Logging:** Registrar logs de auditoria locais no schema do inquilino (`SECURITY_ANOMALY_DETECTED`) para rastreabilidade administrativa.

---

## 📋 Integration Points

- **Better-Auth Hooks:** `src/lib/auth/index.ts` interceptará falhas de verificação de TOTP/Backup Code e chamará o rastreador de falhas de MFA.
- **Cron Jobs Router:** `/api/cron/anomaly-detector` em `src/app/api/cron/anomaly-detector/route.ts` executará o scan heurístico de webhook.
- **Notifications & Mail Engine:** Integração com os utilitários de e-mail e notificações in-app.
