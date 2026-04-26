# Phase 21: Enterprise SSO (SAML/OIDC)

Implementación de Single Sign-On (SSO) de nivel empresarial utilizando Better-Auth para permitir el onboarding fluido de usuarios corporativos.

## Objectives
- Integrar el plugin SSO de Better-Auth.
- Soportar Google Workspace y Microsoft Entra ID (Azure AD).
- Implementar verificación de dominios vía DNS (TXT Records).
- Habilitar Just-In-Time (JIT) Provisioning para dominios verificados.

## Proposed Changes

### 1. Database Schema Extensions
- **[MODIFY] [src/lib/db/schema.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/db/schema.ts)**:
    - Agregar tabla `ssoConfigs`: `id`, `organizationId`, `providerId`, `clientId`, `clientSecret`, `isActive`.
    - Agregar tabla `organizationDomains`: `id`, `organizationId`, `domain`, `isVerified`, `verificationToken`.

### 2. Auth Configuration
- **[MODIFY] [src/lib/auth/index.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/auth/index.ts)**:
    - Registrar `sso()` plugin.
    - Configurar lógica de `mapUser` para JIT provisioning (auto-join org basado en dominio verificado).

### 3. Server Actions & Logic
- **[NEW] [src/app/actions/sso.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/actions/sso.ts)**:
    - `verifyDomainAction`: Lógica para chequear TXT records.
    - `updateSSOConfigAction`: Configuración de IdP.
- **[NEW] [src/lib/sso/dns.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/sso/dns.ts)**: Utilidad para resolución de DNS.

### 4. UI Components
- **[NEW] [src/components/dashboard/settings/SSOSettings.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/dashboard/settings/SSOSettings.tsx)**: Panel de administración para SSO.
- **[MODIFY] [src/components/auth/AuthForm.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/auth/AuthForm.tsx)**: Agregar botón "Login with SSO" que solicita el email para identificar el IdP.

## Verification Plan
- **Automated**: Tests unitarios para `verifyDomainAction` (mocking DNS).
- **Integration**: Simular flujo de callback de Better-Auth y verificar creación de usuario/miembro.
- **Manual**: Configurar un dominio de prueba y validar que el botón de SSO redirige correctamente.
