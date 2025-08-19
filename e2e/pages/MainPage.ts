import { Page } from '@playwright/test';

export class MainPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  async setLanguageToEnglish() {
    const languageSelect = this.page.locator('select');
    await languageSelect.waitFor({ state: 'visible' });
    await languageSelect.selectOption('English');
  }

  async loadExistingProject() {
    // Click on the "Tiệm Trà Kimwon" project button
    await this.page.click('button h3:has-text("Tiệm Trà Kimwon")');
    // Wait for the main display to load by checking for the header
    await this.page.waitForSelector('h1:has-text("SocialSync Pro")', { state: 'visible' });
    // Additional wait to ensure all components are loaded
    await this.page.waitForTimeout(2000);
  }

  async navigateToAffiliateVault() {
    // Try multiple approaches to click the affiliate vault tab
    const selectors = [
      'button:has-text("Affiliate Vault")',
      'text=Affiliate Vault',
      'button.flex.shrink-0.items-center.gap-2:has-text("Affiliate Vault")'
    ];
    
    for (const selector of selectors) {
      try {
        await this.page.click(selector, { timeout: 5000 });
        return;
      } catch (error) {
        console.log(`Failed to click with selector: ${selector}`);
      }
    }
    
    throw new Error('Could not navigate to Affiliate Vault');
  }

  async clickAddNewLink() {
    await this.page.click('button:has-text("Add New Link")');
  }

  async fillAffiliateLinkForm(productName: string, affiliateLink: string) {
    // Wait for the form to appear
    await this.page.waitForSelector('input[name="productName"]', { state: 'visible' });
    await this.page.fill('input[name="productName"]', productName);
    await this.page.fill('input[name="productLink"]', affiliateLink);
  }

  async saveAffiliateLink() {
    await this.page.click('button:has-text("Save")');
  }

  async waitForAffiliateLinkToAppear(productName: string) {
    await this.page.waitForSelector(`div:has-text("${productName}")`, { state: 'visible' });
  }

  async waitForAffiliateLinkToDisappear(productName: string) {
    await this.page.waitForSelector(`div:has-text("${productName}")`, { state: 'detached' });
  }

  async editAffiliateLink(productName: string) {
    // Find the product card and click the edit button
    const productCard = this.page.locator('div', { hasText: productName }).first();
    await productCard.locator('button:has-text("Edit")').click();
  }

  async deleteAffiliateLink(productName: string) {
    // Find the product card and click the delete button
    const productCard = this.page.locator('div', { hasText: productName }).first();
    await productCard.locator('button:has-text("Delete")').click();
  }
}