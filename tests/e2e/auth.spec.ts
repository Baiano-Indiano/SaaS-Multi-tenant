import { test, expect } from '@playwright/test';

test.describe('Authentication & MFA', () => {
  test('should login and bypass MFA with backup code', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/login');

    // 2. Fill credentials
    await page.fill('#email', 'test_admin@example.com');
    await page.fill('#password', 'password123');
    
    // 3. Submit
    await page.keyboard.press('Enter');

    // 4. Wait for redirect or MFA
    try {
        await page.waitForURL('**/verify-2fa**', { timeout: 10000 });
    } catch (e) {
        console.log('Current URL after login attempt:', page.url());
        await page.screenshot({ path: 'tests/e2e/login-failure.png' });
        // If not redirected, maybe we stayed on login with an error
        const errorText = await page.getByText(/invalid|error/i).isVisible();
        if (errorText) {
            console.log('Error message visible on login page');
        }
        throw e;
    }

    // 5. Toggle to backup code mode
    await page.getByRole('button', { name: /Use a backup code/i }).click();

    // 6. Enter the static backup code from seed-test.ts
    const codeInput = page.locator('#code');
    await expect(codeInput).toBeVisible();
    await codeInput.fill('12345-67890');
    await page.keyboard.press('Enter');

    // 7. Should be redirected to organization selection or dashboard
    await expect(page).toHaveURL(/.*selecionar-org|.*dashboard/, { timeout: 15000 });
    
    // Check for either the Select Org title or Dashboard title
    const dashboardTitle = page.getByRole('heading', { name: /Dashboard/i });
    const selectOrgTitle = page.getByText(/Your Organizations/i);
    
    await expect(dashboardTitle.or(selectOrgTitle)).toBeVisible();
  });

  test('should fail with incorrect backup code', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'test_admin@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/verify-2fa**', { timeout: 10000 });
    
    // Toggle to backup code mode
    await page.getByRole('button', { name: /Use a backup code/i }).click();

    const codeInput = page.locator('#code');
    await expect(codeInput).toBeVisible();

    await codeInput.fill('wrong-code');
    await page.keyboard.press('Enter');

    // Look for error toast or message
    await expect(page.getByText(/invalid|error/i)).toBeVisible();
  });
});
