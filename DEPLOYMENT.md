# Guia de Deployment - SaaS Multi-tenant

Este guia descreve os passos necessários para configurar o banco de dados e realizar o deploy da aplicação.

## 1. Banco de Dados (Supabase)

### Configuração Inicial
1. Crie um projeto no Supabase.
2. Em **Settings > Database**, defina uma senha forte (recomendado apenas caracteres alfanuméricos para evitar erros de escape no terminal).
3. Habilite o **Connection Pooling** se necessário (porta 6543 para Transaction Mode).

### Migrações
As migrações devem ser executadas localmente apontando para o banco de produção.

**Passo 1: Preparar o Esquema Público (Public Schema)**
Use a conexão direta (porta 5432) para este passo.
```powershell
$env:DATABASE_URL="postgresql://postgres:[SENHA]@db.[PROJECT_ID].supabase.co:5432/postgres?sslmode=require"; npx drizzle-kit push
```

**Passo 2: Criar Schemas dos Tenants**
```powershell
$env:DATABASE_URL="postgresql://postgres:[SENHA]@db.[PROJECT_ID].supabase.co:5432/postgres?sslmode=require"; npm run db:migrate-tenants
```

## 2. Hospedagem (Vercel)

### Variáveis de Ambiente
Adicione as seguintes variáveis no painel do Vercel:

| Variável | Valor Recomendado | Observação |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres.[PROJECT_ID]:[SENHA]@aws-1-[REGIAO].pooler.supabase.com:6543/postgres?sslmode=require` | Use a porta **6543** (Pooler) |
| `BETTER_AUTH_SECRET` | [Segredo Aleatório] | Pode ser gerado com `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | `https://seu-dominio.vercel.app` | URL de produção |
| `NEXT_PUBLIC_APP_URL` | `https://seu-dominio.vercel.app` | URL de produção |

### Considerações de Segurança
- Certifique-se de que o `DATABASE_URL` no Vercel use o **Transaction Pooler** (porta 6543) para evitar exaustão de conexões em funções serverless.
- Ative o SSL (`?sslmode=require`) para todas as conexões de produção.
