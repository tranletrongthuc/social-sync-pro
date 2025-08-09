import { describe, it, expect } from '@jest/globals';

describe('Airtable Schema Tests', () => {
  describe('IDEAS_SCHEMA', () => {
    it('should include product_id field in the schema', () => {
      // Read the airtableService file directly to check for the product_id field
      const fs = require('fs');
      const path = require('path');
      
      // Read the airtableService.ts file
      const airtableServicePath = path.join(__dirname, '..', 'services', 'airtableService.ts');
      const airtableServiceContent = fs.readFileSync(airtableServicePath, 'utf8');
      
      // Check if the IDEAS_SCHEMA includes product_id field
      expect(airtableServiceContent).toContain("name: 'product_id'");
      expect(airtableServiceContent).toContain("type: 'singleLineText'");
    });
  });
});