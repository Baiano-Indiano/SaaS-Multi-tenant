import { test, expect } from '@playwright/test';

test.describe('Protected Routes', () => {
  test('Dashboard redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/org/demo');
    
    // BetterAuth client redirects to /login if no session is found
    await expect(page).toHaveURL(/.*\/login.*/, { timeout: 15000 });
  });
});
