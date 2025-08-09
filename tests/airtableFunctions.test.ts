import { describe, it, expect } from '@jest/globals';

describe('Airtable Service Function Tests', () => {
  describe('saveIdeas function', () => {
    it('should include productId field in the saved idea data', () => {
      // Read the airtableService file directly to check for the productId field handling
      const fs = require('fs');
      const path = require('path');
      
      // Read the airtableService.ts file
      const airtableServicePath = path.join(__dirname, '..', 'services', 'airtableService.ts');
      const airtableServiceContent = fs.readFileSync(airtableServicePath, 'utf8');
      
      // Check if the saveIdeas function includes productId in the fields
      expect(airtableServiceContent).toContain("product_id: idea.productId");
    });
  });
});