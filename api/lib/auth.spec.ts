import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.describe('Authentication Flow', () => {
  test('Admin can log in successfully', async ({ page }) => {
    // 1. Generate a unique ID for this specific test run.
    const testRunId = uuidv4();
    
    // 2. Log the ID to the console. Our orchestrator will read this.
    console.log(`[Test Run ID]: ${testRunId}`);

    // 3. Set a custom HTTP header. This header will be sent with every
    // API request made by the page during this test.
    await page.setExtraHTTPHeaders({
      'X-Test-Run-Id': testRunId,
    });

    await page.goto('/admin');
    await page.getByPlaceholder('Enter admin password').fill(process.env.VITE_ADMIN_PASSWORD || 'admin123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('heading', { name: 'AI Services Administration' })).toBeVisible();
  });
});