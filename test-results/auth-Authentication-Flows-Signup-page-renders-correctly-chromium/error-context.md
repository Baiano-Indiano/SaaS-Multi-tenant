# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flows >> Signup page renders correctly
- Location: tests\auth.spec.ts:13:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('heading', { level: 2 }).first()
Expected substring: "Gravity"
Received string:    "Crie sua conta"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByRole('heading', { level: 2 }).first()
    8 × locator resolved to <h2 class="text-3xl font-extrabold tracking-tight text-white">Crie sua conta</h2>
      - unexpected value "Crie sua conta"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e6]: G
      - heading "Crie sua conta" [level=2] [ref=e7]
      - paragraph [ref=e8]: Junte-se à próxima geração de startups enterprise.
    - generic [ref=e10]:
      - generic [ref=e12]:
        - generic [ref=e13]: Criar uma conta
        - generic [ref=e14]: Preencha os dados abaixo para começar sua jornada.
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]:
            - generic [ref=e18]: Nome
            - textbox "Nome" [ref=e19]:
              - /placeholder: Seu nome
          - generic [ref=e20]:
            - generic [ref=e21]: E-mail
            - textbox "E-mail" [ref=e22]:
              - /placeholder: exemplo@email.com
          - generic [ref=e23]:
            - generic [ref=e24]: Senha
            - textbox "Senha" [ref=e25]
        - generic [ref=e26]:
          - button "Cadastrar" [ref=e27]
          - generic [ref=e28]:
            - text: Já tem uma conta?
            - button "Faça login" [ref=e29]
  - button "Open Next.js Dev Tools" [ref=e35] [cursor=pointer]:
    - img [ref=e36]
  - alert [ref=e39]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication Flows', () => {
  4  |   test('Login page renders correctly', async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     // Expect the login text or form to exist
  7  |     await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('Gravity');
  8  |     await expect(page.getByLabel(/e-mail/i)).toBeVisible();
  9  |     await expect(page.getByLabel(/senha/i)).toBeVisible();
  10 |     await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  11 |   });
  12 | 
  13 |   test('Signup page renders correctly', async ({ page }) => {
  14 |     await page.goto('/register');
> 15 |     await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('Gravity');
     |                                                                   ^ Error: expect(locator).toContainText(expected) failed
  16 |     await expect(page.getByLabel(/nome/i)).toBeVisible();
  17 |     await expect(page.getByLabel(/e-mail/i)).toBeVisible();
  18 |     await expect(page.getByLabel(/senha/i)).toBeVisible();
  19 |     await expect(page.getByRole('button', { name: /cadastrar/i })).toBeVisible();
  20 |   });
  21 | });
  22 | 
```