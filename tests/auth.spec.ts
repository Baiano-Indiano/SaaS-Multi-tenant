import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('Login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    // Expect the login text or form to exist
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('Gravity');
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('Signup page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('Crie sua conta');
    await expect(page.getByLabel(/nome/i)).toBeVisible();
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /cadastrar/i })).toBeVisible();
  });
});
