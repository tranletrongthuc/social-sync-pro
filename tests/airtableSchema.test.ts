import { describe, it, expect } from '@jest/globals';
import { IDEAS_SCHEMA } from '../services/airtableService';

describe('Airtable Schema Tests', () => {
  describe('IDEAS_SCHEMA', () => {
    it('should include product_id field in the schema', () => {
      const productIdField = IDEAS_SCHEMA.find((field: any) => field.name === 'product_id');
      expect(productIdField).toBeDefined();
      expect(productIdField?.type).toBe('singleLineText');
    });
  });
});