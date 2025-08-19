import { test, expect } from '@playwright/test';

test.describe('Authentication and Project Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const languageSelect = page.locator('select');
    await languageSelect.waitFor({ state: 'visible' });
    await languageSelect.selectOption('English');
    
    // Load an existing project to access the main application interface
    // Click on the "Tiệm Trà Kimwon" project button
    await page.click('button h3:has-text("Tiệm Trà Kimwon")');
    // Wait for the main display to load by checking for the header
    await page.waitForSelector('h1:has-text("SocialSync Pro")', { state: 'visible' });
  });

  test('Admin Login and Logout', async ({ page }) => {
    await page.goto('/admin');

    // Test with incorrect password
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Login")');
    await expect(page.locator('.Toast')).toContainText('Invalid password'); // Assuming a Toast component for errors

    // Test with correct password
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Login")');

    // Assert that the AdminPage component is rendered
    // This assumes there's a unique element on the AdminPage, e.g., a heading or a specific button
    await expect(page.locator('h1:has-text("Admin Panel")')).toBeVisible(); // Example: check for an H1 with "Admin Panel"
    // Or check for a specific button/element that only appears on the admin page
    // await expect(page.locator('button:has-text("Manage AI Services")')).toBeVisible();

    // (Future) Implement and test a logout feature - not implemented yet in the app
    // await page.click('button:has-text("Logout")');
    // await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Project Loading from Airtable', async ({ page }) => {
    await page.goto('/');

    // Click "Load from Airtable"
    await page.click('button:has-text("Load from Airtable")');

    // Assert that the Airtable load modal appears
    await expect(page.locator('.AirtableLoadModal')).toBeVisible(); // Assuming a class name for the modal

    // Select a brand from the list (assuming the first one for simplicity)
    // This might require more specific selectors depending on how brands are rendered
    await page.locator('.AirtableLoadModal button').first().click(); // Click the first button within the modal

    // Assert that the main application interface (MainDisplay) is loaded and the correct brand name is visible
    // This assumes MainDisplay has a unique element, e.g., a heading with the brand name
    await expect(page.locator('h1:has-text("Brand Name")')).toBeVisible(); // Placeholder for actual brand name assertion
  });

  test('Project Saving and Exporting', async ({ page }) => {
    await page.goto('/'); // Assuming a project is loaded or can be loaded here

    // Click the "Save Project" button and assert download
    const [ssprojDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Save Project")'),
    ]);
    expect(ssprojDownload.suggestedFilename()).toMatch(/\.ssproj$/);

    // Navigate to "Brand Kit" tab and export
    await page.click('button:has-text("Brand Kit")');
    const [docxDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export Brand Kit")'),
    ]);
    expect(docxDownload.suggestedFilename()).toMatch(/\.docx$/);

    // Navigate to "Media Plan" tab and export
    await page.click('button:has-text("Media Plan")');
    const [xlsxDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export Plan")'),
    ]);
    expect(xlsxDownload.suggestedFilename()).toMatch(/\.xlsx$/);
  });

});
