import { test, expect } from '@playwright/test';

test.describe('Strategy Hub', () => {

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

  test('Trend and Idea Management', async ({ page }) => {
    await page.goto('/'); // Assuming a project is loaded or can be loaded here

    // Navigate to the "Strategy Hub"
    await page.click('button:has-text("Strategy Hub")');

    // Click "Add Trend" and fill out the form
    await page.click('button:has-text("Add Trend")');
    await page.fill('input[placeholder*="Trend Name"]', 'Summer Marketing Campaign');
    await page.click('button:has-text("Save Trend")');

    // Assert that the new trend appears and is selected
    await expect(page.locator('.TrendList li:has-text("Summer Marketing Campaign")')).toHaveClass(/selected/); // Assuming selected trend has 'selected' class

    // Click "Generate Ideas"
    await page.click('button:has-text("Generate Ideas")');

    // Assert that new idea cards are rendered in the ideas list
    await expect(page.locator('.IdeaCard')).toHaveCount(3); // Assuming 3 idea cards are generated

    // Delete the trend and confirm that it and its ideas are removed
    await page.click('button:has-text("Delete Trend")');
    await expect(page.locator('.TrendList li:has-text("Summer Marketing Campaign")')).not.toBeVisible();
    await expect(page.locator('.IdeaCard')).toHaveCount(0);
  });

  test('Automated Facebook Trend Analysis', async ({ page }) => {
    await page.goto('/'); // Assuming a project is loaded or can be loaded here

    // Navigate to the "Strategy Hub"
    await page.click('button:has-text("Strategy Hub")');

    // Enter an industry (e.g., "Fashion") into the Facebook Strategy Automation input
    await page.fill('input[placeholder*="Enter Industry"]', 'Fashion');

    // Click "Search Trends"
    await page.click('button:has-text("Search Trends")');

    // Assert that new trends, populated with data from the search, are added to the trends list
    await expect(page.locator('.TrendList li')).toHaveCount(3); // Assuming 3 trends are found
    await expect(page.locator('.TrendList li').first()).toContainText('Fashion Trends'); // Placeholder for actual trend name
  });

  test('Content Package from Product', async ({ page }) => {
    await page.goto('/'); // Assuming a project is loaded or can be loaded here

    // Navigate to the "Affiliate Vault"
    await page.click('button:has-text("Affiliate Vault")');

    // Select a product and click "Generate Ideas"
    await page.locator('.ProductCard').first().click(); // Click on the first product card
    await page.click('button:has-text("Generate Ideas")');

    // Assert that the user is taken to the "Strategy Hub" and a new product-based trend is created
    await expect(page.locator('h1:has-text("Strategy Hub")')).toBeVisible();
    await expect(page.locator('.TrendList li').last()).toContainText('Product-based Trend'); // Placeholder

    // Select an idea and open the "Generate Content Package" wizard
    await page.locator('.IdeaCard').first().click(); // Click on the first idea card
    await page.click('button:has-text("Generate Content Package")');

    // Confirm the correct product is pre-selected
    await expect(page.locator('input[placeholder*="Product Name"]')).toHaveValue('Selected Product Name'); // Placeholder

    // Generate the package
    await page.click('button:has-text("Generate Package")');

    // Assert that a new media plan is created and that all posts are linked to the affiliate product
    await expect(page.locator('h1:has-text("Media Plan")')).toBeVisible();
    await expect(page.locator('.PostCard')).toHaveCount(5); // Assuming 5 posts
    await expect(page.locator('.PostCard').first()).toContainText('Affiliate Link'); // Placeholder
  });

});
