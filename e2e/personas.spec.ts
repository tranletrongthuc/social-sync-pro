import { test, expect } from '@playwright/test';

test.describe('Persona Management', () => {

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

  test('Persona Creation and Assignment', async ({ page }) => {
    await page.goto('/'); // Assuming a project is loaded or can be loaded here

    // Navigate to the "Personas" tab
    await page.click('button:has-text("Personas")');

    // Click "Add Persona" and fill out the details
    await page.click('button:has-text("Add Persona")');
    await page.fill('input[placeholder*="Persona Name"]', 'Test Persona');
    await page.fill('textarea[placeholder*="Description"]', 'A test persona for e2e.');

    // Upload an avatar for the persona (create a dummy file)
    const dummyImagePath = './e2e/dummy-avatar.png';
    // Create a dummy image file (e.g., a small transparent PNG)
    // In a real scenario, you'd have a fixture or generate a real image
    // For now, we'll simulate the file input
    await page.evaluate((path) => {
      const content = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const byteCharacters = atob(content.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const file = new File([blob], 'dummy-avatar.png', { type: 'image/png' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const input = document.createElement('input');
      input.type = 'file';
      input.files = dataTransfer.files;
      Object.defineProperty(input, 'files', {
        value: dataTransfer.files,
        writable: false,
      });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, dummyImagePath);

    await page.click('button:has-text("Save Persona")');

    // Assert that the new persona card is displayed
    await expect(page.locator('.PersonaCard:has-text("Test Persona")')).toBeVisible();

    // Navigate to the "Media Plan" tab
    await page.click('button:has-text("Media Plan")');

    // Select a media plan and use the dropdown to assign the new persona
    // This assumes a media plan exists and has a persona assignment dropdown
    await page.locator('.MediaPlanCard').first().click(); // Click on a media plan to open its details
    await page.selectOption('select[aria-label="Assign Persona"]', { label: 'Test Persona' });

    // Assert that the persona's details are visible in the plan header and that post prompts are updated.
    await expect(page.locator('.PlanHeader:has-text("Test Persona")')).toBeVisible();
    await expect(page.locator('.PostCard').first()).toContainText('Test Persona'); // Assuming post prompts reflect persona
  });

});
