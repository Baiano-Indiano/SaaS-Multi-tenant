import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Authentication & MFA', () => {
  test.beforeEach(() => {
    try {
      execSync('npm run db:seed-test', { stdio: 'ignore' });
    } catch (e) {
      console.error('Failed to seed database:', e);
    }
  });

  test('should login and bypass MFA with backup code', async ({ page }) => {
    // 0. Setup console listener
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
      }
    });

    // 1. Go to login page
    await page.goto('/login');

    // 2. Fill credentials
    await page.fill('#email', 'test_admin@example.com');
    await page.fill('#password', 'password123');
    
    // 3. Submit
    await page.keyboard.press('Enter');

    // 4. Wait for redirect or MFA

    try {
        await page.waitForURL('**/verify-2fa**', { timeout: 15000, waitUntil: 'commit' });
    } catch (e) {
        console.log('Current URL after login attempt:', page.url());
        await page.screenshot({ path: 'tests/e2e/login-failure.png' });
        // If not redirected, maybe we stayed on login with an error
        const errorText = await page.locator('[data-sonner-toast]').first().isVisible().catch(() => false);
        if (errorText) {
            console.log('Error message visible on login page');
        }
        throw e;
    }

    // 5. Toggle to backup code mode
    await page.waitForTimeout(2000); // Wait for page hydration
    await page.getByRole('button', { name: /Use a backup code/i }).click();
    await expect(page.getByText('Backup Code').first()).toBeVisible({ timeout: 5000 });

    // 6. Enter the static backup code from seed-test.ts
    const codeInput = page.locator('#code');
    await expect(codeInput).toBeVisible();
    await codeInput.fill('12345-67890');
    await page.keyboard.press('Enter');

    // 7. Should be redirected to organization selection or dashboard
    try {
        await expect(page).toHaveURL(/.*selecionar-org|.*dashboard/, { timeout: 15000 });
    } catch (e) {
        console.log('Current URL after backup code attempt:', page.url());
        await page.screenshot({ path: 'tests/e2e/backup-failure.png' });
        throw e;
    }
    
    // Check for either the Select Org title or Dashboard title
    const dashboardTitle = page.getByRole('heading', { name: /Dashboard/i });
    const selectOrgTitle = page.getByText(/Your Organizations/i);
    
    await expect(dashboardTitle.or(selectOrgTitle)).toBeVisible();
  });

  test('should fail with incorrect backup code', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'test_admin@example.com');
    await page.fill('#password', 'password123');
    await page.keyboard.press('Enter');

    await page.waitForURL('**/verify-2fa**', { timeout: 15000, waitUntil: 'commit' });
    
    // Toggle to backup code mode
    await page.waitForTimeout(2000); // Wait for page hydration
    await page.getByRole('button', { name: /Use a backup code/i }).click();
    await expect(page.getByText('Backup Code').first()).toBeVisible({ timeout: 5000 });

    const codeInput = page.locator('#code');
    await expect(codeInput).toBeVisible();

    await codeInput.fill('wrong-code');
    await page.keyboard.press('Enter');

    // Look for error toast or message
    await expect(page.locator('[data-sonner-toast]').first()).toContainText(/invalid|error/i);
  });
});
