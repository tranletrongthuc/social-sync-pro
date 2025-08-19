import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveIdeas, findRecordByField } from '../services/airtableService';

jest.mock('../services/airtableService', () => {
  const actualModule = jest.requireActual('../services/airtableService');
  return {
    ...actualModule,
    airtableFetch: jest.fn(),
    findRecordByField: jest.fn(),
  };
});

describe('Airtable Service Function Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveIdeas function', () => {
    it('should include productId field in the saved idea data', async () => {
      const { airtableFetch } = require('../services/airtableService');
      (airtableFetch as jest.Mock).mockResolvedValue({ records: [] });
      (findRecordByField as jest.Mock).mockResolvedValue({ id: 'rec123', fields: { trend_id: 'trend-123' } });

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

      await saveIdeas(ideas);

      expect(airtableFetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        body: JSON.stringify({
          records: [
            {
              fields: {
                idea_id: 'idea-1',
                trend_id: ['rec123'],
                title: 'Test Idea',
                description: 'Test Description',
                target_audience: 'Test Audience',
                product_id: 'product-123',
              },
            },
          ],
        }),
      });
    });
  });
});