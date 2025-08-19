import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { IDEAS_SCHEMA, saveIdeas, findRecordByField } from '../services/airtableService';

jest.mock('../services/airtableService', () => {
  const actualModule = jest.requireActual('../services/airtableService');
  return {
    ...actualModule,
    airtableFetch: jest.fn(),
    findRecordByField: jest.fn(),
  };
});

describe('Airtable Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('IDEAS_SCHEMA', () => {
    it('should include product_id field in the schema', () => {
      const productIdField = IDEAS_SCHEMA.find((field: any) => field.name === 'product_id');
      expect(productIdField).toBeDefined();
      expect(productIdField?.type).toBe('singleLineText');
    });
  });

  describe('saveIdeas function', () => {
    it('should validate that ideas have required fields', async () => {
      const ideas = [
        {
          id: 'idea-1',
          trendId: 'trend-123',
          title: '',
          description: 'Test Description',
          targetAudience: 'Test Audience',
          productId: 'product-123',
        },
      ];

      await expect(saveIdeas(ideas)).rejects.toThrow(
        'Idea is missing required fields for Airtable save. ID: true, Title: false, Description: true, TargetAudience: true'
      );
    });

    it('should throw an error if trend is not found', async () => {
      (findRecordByField as jest.Mock).mockResolvedValue(null);

      const ideas = [
        {
          id: 'idea-1',
          trendId: 'trend-123',
          title: 'Test Idea',
          description: 'Test Description',
          targetAudience: 'Test Audience',
          productId: 'product-123',
        },
      ];

      await expect(saveIdeas(ideas)).rejects.toThrow('Trend with ID trend-123 not found.');
    });
  });
});