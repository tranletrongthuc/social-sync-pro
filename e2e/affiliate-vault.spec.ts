import { test, expect } from '@playwright/test';
import { MainPage } from './pages/MainPage';

test.describe('Affiliate Vault', () => {

  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.goto();
    await mainPage.setLanguageToEnglish();
    await mainPage.loadExistingProject();
  });

  test('CRUD Operations for Affiliate Links', async ({ page }) => {
    const mainPage = new MainPage(page);
    
    // Navigate to the "Affiliate Vault"
    await mainPage.navigateToAffiliateVault();
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'test-results/affiliate-vault-before-add.png' });
    
    // Print the page content for debugging
    const content = await page.content();
    console.log("Page content:", content.substring(0, 1000));

    // Click "Add New Link" and fill out the form
    await mainPage.clickAddNewLink();
    
    // Take a screenshot to see the form
    await page.screenshot({ path: 'test-results/affiliate-vault-form.png' });
    
    await mainPage.fillAffiliateLinkForm('Test Product', 'http://test.com/affiliate');
    await mainPage.saveAffiliateLink();

    // Assert that the new link appears in the list
    await mainPage.waitForAffiliateLinkToAppear('Test Product');

    // Edit the newly created link
    await mainPage.editAffiliateLink('Test Product');
    await mainPage.fillAffiliateLinkForm('Updated Product', 'http://test.com/affiliate');
    await mainPage.saveAffiliateLink();

    // Assert that the changes are saved and displayed
    await mainPage.waitForAffiliateLinkToAppear('Updated Product');
    await mainPage.waitForAffiliateLinkToDisappear('Test Product');

    // Delete the link and confirm its removal
    await mainPage.deleteAffiliateLink('Updated Product');
    await mainPage.waitForAffiliateLinkToDisappear('Updated Product');
  });

  test('Import Links from File', async ({ page }) => {
    const mainPage = new MainPage(page);
    
    // Navigate to the "Affiliate Vault"
    await mainPage.navigateToAffiliateVault();
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'test-results/affiliate-vault-import-before.png' });

    // Click "Import from File"
    await page.click('button:has-text("Import from File")');

    // Create a dummy file for upload
    const filePath = './e2e/test-affiliate-links.csv';
    await page.evaluate((path) => {
      const content = 'Product Name,Affiliate Link\nTest Product 1,http://test1.com\nTest Product 2,http://test2.com';
      const blob = new Blob([content], { type: 'text/csv' });
      const file = new File([blob], 'test-affiliate-links.csv', { type: 'text/csv' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const input = document.createElement('input');
      input.type = 'file';
      input.files = dataTransfer.files;
      // This is a workaround as setInputFiles requires a visible input element
      // In a real scenario, you'd target the actual file input element
      Object.defineProperty(input, 'files', {
        value: dataTransfer.files,
        writable: false,
      });
      // Dispatch a change event to trigger the file upload logic
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, filePath);

    // Assert that the new links are added to the vault
    await mainPage.waitForAffiliateLinkToAppear('Test Product 1');
    await mainPage.waitForAffiliateLinkToAppear('Test Product 2');
  });

});