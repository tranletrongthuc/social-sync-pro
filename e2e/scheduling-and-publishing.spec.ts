import { test, expect } from '@playwright/test';

test.describe('Scheduling and Publishing', () => {

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

  test('Single Post Scheduling', async ({ page }) => {
    await page.goto('/'); // Assuming a project and media plan are loaded

    // Open the details for a draft post (click on the first post card)
    await page.locator('.PostCard').first().click();

    // Click the "Schedule" button
    await page.click('button:has-text("Schedule")');

    // Select a date and time in the future
    // This will depend on the date picker implementation. Assuming a simple input for now.
    await page.fill('input[placeholder*="Select Date"]', '2025-12-25');
    await page.fill('input[placeholder*="Select Time"]', '10:00 AM');
    await page.click('button:has-text("Confirm Schedule")');

    // Assert that the post card updates to show the "Scheduled" status
    await expect(page.locator('.PostCard').first()).toContainText('Scheduled');
  });

  test('Bulk Scheduling', async ({ page }) => {
    await page.goto('/'); // Assuming a project and media plan are loaded

    // Select multiple posts in the media plan feed
    await page.locator('.PostCard').nth(0).locator('input[type="checkbox"]').check();
    await page.locator('.PostCard').nth(1).locator('input[type="checkbox"]').check();

    // Click the "Schedule" button in the bulk action bar
    await page.click('button:has-text("Schedule Selected")'); // Assuming a button for bulk schedule

    // Set a start date and time, and an interval
    await page.fill('input[placeholder*="Start Date"]', '2025-12-26');
    await page.fill('input[placeholder*="Start Time"]', '09:00 AM');
    await page.fill('input[placeholder*="Interval (minutes)"]', '60');
    await page.click('button:has-text("Confirm Bulk Schedule")');

    // Assert that all selected posts are updated with their new scheduled times
    await expect(page.locator('.PostCard').nth(0)).toContainText('Scheduled');
    await expect(page.locator('.PostCard').nth(1)).toContainText('Scheduled');
  });

  test('Direct Publishing', async ({ page }) => {
    await page.goto('/'); // Assuming a project and media plan are loaded, and social account is connected

    // Open the details for a draft post in a plan assigned to that persona
    await page.locator('.PostCard').first().click();

    // Click "Publish Now"
    await page.click('button:has-text("Publish Now")');

    // Assert that the post status changes to "Published" and a link to the live post is displayed
    await expect(page.locator('.PostCard').first()).toContainText('Published');
    await expect(page.locator('.PostCard').first().locator('a:has-text("View Live Post")')).toBeVisible();
  });

});
