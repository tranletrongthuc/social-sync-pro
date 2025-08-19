import { test, expect } from '@playwright/test';

test.describe('Content Creation', () => {

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

  test('Full Brand Kit Generation', async ({ page }) => {
    await page.goto('/'); // Assuming Idea Profiler is the default start page or navigate explicitly

    // Enter a business idea and generate a brand profile
    await page.fill('textarea[placeholder*="business idea"]', 'A sustainable fashion brand for young adults.');
    await page.click('button:has-text("Generate Brand Profile")');

    // Assert that the "Brand Profiler" step is active and populated with data
    await expect(page.locator('h2:has-text("Brand Profile")')).toBeVisible();
    await expect(page.locator('div:has-text("Target Audience:")')).toBeVisible(); // Check for some populated data

    // Generate the full brand kit
    await page.click('button:has-text("Generate Full Brand Kit")');

    // Assert that the app transitions to the "Brand Kit" tab within MainDisplay
    await expect(page.locator('button:has-text("Brand Kit")')).toHaveClass(/active/); // Assuming active tab has 'active' class
    await expect(page.locator('h1:has-text("Brand Kit")')).toBeVisible(); // Check for Brand Kit heading

    // Verify that logo concepts, color palettes, and a media plan are visible
    await expect(page.locator('h3:has-text("Logo Concepts")')).toBeVisible();
    await expect(page.locator('h3:has-text("Color Palettes")')).toBeVisible();
    await expect(page.locator('h3:has-text("Media Plan")')).toBeVisible();
  });

  test('Media Plan Generation from Wizard', async ({ page }) => {
    await page.goto('/'); // Assuming a project is loaded or can be loaded here

    // Navigate to the "Media Plan" tab
    await page.click('button:has-text("Media Plan")');

    // Click the "New Plan" button to open the wizard
    await page.click('button:has-text("New Plan")');

    // Fill out the wizard (example: prompt, platforms, persona)
    await page.fill('textarea[placeholder*="plan prompt"]', 'Promote new summer collection.');
    await page.click('input[value="Facebook"]'); // Select Facebook platform
    await page.click('button:has-text("Generate Plan")');

    // Assert that a new media plan is added to the list and set as the active plan
    await expect(page.locator('.MediaPlanList li').last()).toHaveClass(/active/); // Assuming active plan has 'active' class
    await expect(page.locator('h2:has-text("New Summer Collection Plan")')).toBeVisible(); // Placeholder for plan name

    // Verify that the generated posts appear in the feed
    await expect(page.locator('.PostCard')).toHaveCount(5); // Assuming 5 posts are generated
  });

  test('Post Generation and Refinement', async ({ page }) => {
    await page.goto('/'); // Assuming a project and media plan are loaded

    // Open the details of a post (click on the first post card)
    await page.locator('.PostCard').first().click();

    // Click "Refine Content"
    await page.click('button:has-text("Refine Content")');

    // Assert that the post content is updated with the refined version
    // This assumes the content changes visibly, e.g., a specific phrase appears or length changes
    await expect(page.locator('.PostDetailModal .post-content')).not.toContainText('Original content'); // Placeholder

    // Generate an image for the post
    await page.click('button:has-text("Generate Image")');

    // Assert that the new image is displayed in the post card
    await expect(page.locator('.PostDetailModal img.post-image')).toBeVisible();
  });

});
