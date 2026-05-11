# Session Anomaly Detection (Detecção de Anomalias de Sessão)

Este módulo implementa uma camada de segurança proativa que monitora o ambiente de login dos usuários para detectar acessos suspeitos.

## Como Funciona

### 1. Fingerprinting de Ambiente
Cada login é associado a um "fingerprint" único gerado a partir do hash SHA-256 da combinação do **Endereço IP** e do **User-Agent** do navegador.

### 2. Memória de Dispositivos (Redis)
O sistema utiliza o Redis para manter um histórico de ambientes conhecidos para cada usuário:
- **Chave:** `user:{userId}:envs` (Redis Set)
- **Operação:** Otimizada para buscas em tempo real (O(1)) durante o fluxo de autenticação.

### 3. Detecção e Alerta
Durante o login (através de hooks do Better Auth), o sistema verifica se o fingerprint atual já é conhecido:

- **Ambiente Novo/Suspeito:**
    - Registra um **Audit Log** com a ação `SECURITY_ANOMALY_DETECTED`.
    - Envia uma **Notificação Interna** para o dashboard do usuário.
    - Dispara um **E-mail de Alerta** via Resend com detalhes do IP, Localização (Geolocalização mockada por enquanto) e Dispositivo.
    - Adiciona o novo fingerprint à lista de conhecidos (para evitar alertas repetidos no mesmo dispositivo novo).

## Integração Técnica

### Hook de Autenticação
A lógica está integrada no `hooks.after` do Better Auth (`src/lib/auth/index.ts`), interceptando os caminhos de `sign-in/` e `callback`.

### Módulo de Segurança
Localizado em `src/lib/security/anomaly-detection.ts`.

### Sistema de E-mail
Implementado em `src/lib/mail.ts`, utilizando a biblioteca **Resend**.

## Configuração Necessária
Para habilitar os alertas por e-mail em produção, adicione a chave do Resend ao seu ambiente:
```env
RESEND_API_KEY="re_..."
```

## Próximos Passos
- [ ] Integrar um serviço de Geo-IP real (ex: ipapi.co ou MaxMind).
- [ ] Implementar o "bloqueio" ou desafio de MFA obrigatório quando uma anomalia é detectada e o usuário tem 2FA configurado.
