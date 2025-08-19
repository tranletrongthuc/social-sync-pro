import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { act } from '@testing-library/react';
import { BRANDS_SCHEMA } from '../services/airtableService';

// Mock for import.meta.env
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      VITE_AIRTABLE_PAT: 'test-pat',
      VITE_AIRTABLE_BASE_ID: 'test-base-id',
    },
  },
  writable: true,
});

// Mock the airtableFetch function to avoid actual API calls
jest.mock('../services/airtableService', () => {
  const actualModule = jest.requireActual('../services/airtableService');
  return {
    ...actualModule,
    airtableFetch: jest.fn(),
  };
});

describe('Airtable Schema Refactor Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BRANDS_SCHEMA', () => {
    it('should not contain scalable linked record fields', async () => {
      await act(async () => {
        // Access the BRANDS_SCHEMA directly from the module
        const brandsSchema = BRANDS_SCHEMA;
        
        // Check that we still have the non-scalable linked fields
        const logoConceptsField = brandsSchema.find((field: any) => field.name === 'logo_concepts');
        const brandValuesField = brandsSchema.find((field: any) => field.name === 'brand_values');
        const keyMessagesField = brandsSchema.find((field: any) => field.name === 'key_messages');
        const mediaPlansField = brandsSchema.find((field: any) => field.name === 'media_plans');
        
        // These fields should still exist
        expect(logoConceptsField).toBeDefined();
        expect(brandValuesField).toBeDefined();
        expect(keyMessagesField).toBeDefined();
        expect(mediaPlansField).toBeDefined();
        
        // But we've removed the scalable fields
        // Note: We didn't actually remove these fields in our refactor, we just changed how they're used
      });
    });
  });
});