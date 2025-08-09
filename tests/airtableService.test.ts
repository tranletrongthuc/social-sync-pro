import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as airtableService from '../services/airtableService';
import { Idea, Trend } from '../types';

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

describe('Airtable Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('IDEAS_SCHEMA', () => {
    it('should include product_id field in the schema', () => {
      // Access the IDEAS_SCHEMA directly from the module
      const ideasSchema = require('../services/airtableService').IDEAS_SCHEMA;
      
      // Find the product_id field in the schema
      const productIdField = ideasSchema.find((field: any) => field.name === 'product_id');
      
      // Verify that the product_id field exists and has the correct type
      expect(productIdField).toBeDefined();
      expect(productIdField.type).toBe('singleLineText');
    });
  });

  describe('saveIdeas function', () => {
    const mockTrend: Trend = {
      id: 'trend-123',
      brandId: 'brand-123',
      industry: 'Tech',
      topic: 'AI Trends',
      keywords: ['AI', 'Machine Learning'],
      links: [],
      analysis: 'Analysis of AI trends',
      createdAt: '2023-01-01T00:00:00Z',
    };

    const mockIdeas: Idea[] = [
      {
        id: 'idea-1',
        trendId: 'trend-123',
        title: 'AI in Everyday Life',
        description: 'How AI is becoming part of our daily routines',
        targetAudience: 'General consumers',
        productId: 'product-456', // This is the new field we're testing
      },
      {
        id: 'idea-2',
        trendId: 'trend-123',
        title: 'Machine Learning for Business',
        description: 'How businesses can leverage ML',
        targetAudience: 'Business owners',
        // No productId for this idea
      },
    ];

    it('should validate that ideas have required fields', async () => {
      const invalidIdeas: Idea[] = [
        {
          id: 'idea-3',
          trendId: 'trend-123',
          title: '', // Missing title
          description: 'Description',
          targetAudience: 'Audience',
          productId: 'product-456',
        },
      ];

      await expect(airtableService.saveIdeas(invalidIdeas)).rejects.toThrow(
        'Idea at index 0 is missing required fields for Airtable save'
      );
    });
  });
});