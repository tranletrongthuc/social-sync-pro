import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as airtableService from '../services/airtableService';

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
    fetchFullRecordsByFormula: jest.fn(),
    findRecordByField: jest.fn(),
  };
});

describe('Airtable Schema Refactor Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BRANDS_SCHEMA', () => {
    it('should not contain scalable linked record fields', () => {
      // Access the BRANDS_SCHEMA directly from the module
      const brandsSchema = require('../services/airtableService').BRANDS_SCHEMA;
      
      // Verify that the schema does not contain the problematic fields
      const mediaPlansField = brandsSchema.find((field: any) => field.name === 'media_plans');
      const postsField = brandsSchema.find((field: any) => field.name === 'posts');
      const trendsField = brandsSchema.find((field: any) => field.name === 'trends');
      const personasField = brandsSchema.find((field: any) => field.name === 'personas');
      
      // These fields should still exist (they're not the scalable ones)
      expect(mediaPlansField).toBeDefined();
      expect(postsField).toBeUndefined(); // Should be removed
      expect(trendsField).toBeUndefined(); // Should be removed
      expect(personasField).toBeUndefined(); // Should be removed
      
      // Check that we still have the non-scalable linked fields
      const logoConceptsField = brandsSchema.find((field: any) => field.name === 'logo_concepts');
      const brandValuesField = brandsSchema.find((field: any) => field.name === 'brand_values');
      const keyMessagesField = brandsSchema.find((field: any) => field.name === 'key_messages');
      
      expect(logoConceptsField).toBeDefined();
      expect(brandValuesField).toBeDefined();
      expect(keyMessagesField).toBeDefined();
    });
  });

  describe('listMediaPlanGroupsForBrand function', () => {
    it('should query Media_Plans table directly instead of using brand fields', async () => {
      const mockPlanRecords = [
        {
          id: 'rec1',
          fields: {
            plan_id: 'plan-1',
            name: 'Test Plan',
            prompt: 'Test prompt',
            source: 'manual',
            product_images_json: JSON.stringify([{ name: 'test.jpg', type: 'image/jpeg', data: 'base64data' }]),
            persona: ['recPersona1']
          }
        }
      ];
      
      const mockPersonaRecords = [
        {
          id: 'recPersona1',
          fields: {
            persona_id: 'persona-1'
          }
        }
      ];
      
      // Mock the fetch functions
      const { fetchFullRecordsByFormula } = require('../services/airtableService');
      (fetchFullRecordsByFormula as jest.Mock)
        .mockImplementation((tableName: string) => {
          if (tableName === 'Media_Plans') {
            return Promise.resolve(mockPlanRecords);
          }
          if (tableName === 'Personas') {
            return Promise.resolve(mockPersonaRecords);
          }
          return Promise.resolve([]);
        });
      
      const result = await airtableService.listMediaPlanGroupsForBrand('brand-123');
      
      // Verify that fetchFullRecordsByFormula was called with the correct parameters
      expect(fetchFullRecordsByFormula).toHaveBeenCalledWith(
        'Media_Plans', 
        `{brand} = 'brand-123'`, 
        ['plan_id', 'name', 'prompt', 'source', 'product_images_json', 'persona']
      );
      
      // Verify the result structure
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'plan-1',
        name: 'Test Plan',
        prompt: 'Test prompt',
        source: 'manual',
        productImages: [{ name: 'test.jpg', type: 'image/jpeg', data: 'base64data' }],
        personaId: 'persona-1'
      });
    });
  });

  describe('loadProjectFromAirtable function', () => {
    it('should query child tables directly instead of using brand linked fields', async () => {
      const mockBrandRecord = {
        id: 'recBrand1',
        fields: {
          brand_id: 'brand-123',
          name: 'Test Brand',
          mission: 'Test mission',
          usp: 'Test USP',
          target_audience: 'Test audience',
          personality: 'Test personality',
          color_palette_json: '{}',
          font_recs_json: '{}',
          unified_profile_json: '{}',
          logo_concepts: [],
          brand_values: [],
          key_messages: []
        }
      };
      
      const mockPersonaRecords = [
        {
          id: 'recPersona1',
          fields: {
            persona_id: 'persona-1',
            nick_name: 'Test Persona',
            main_style: 'Casual',
            activity_field: 'Lifestyle',
            outfit_description: 'Casual wear',
            avatar_image_key: 'avatar-key',
            avatar_image_url: 'http://example.com/avatar.jpg'
          }
        }
      ];
      
      const mockTrendRecords = [
        {
          id: 'recTrend1',
          fields: {
            trend_id: 'trend-1',
            industry: 'Tech',
            topic: 'AI',
            keywords: 'AI,ML',
            links_json: '[]',
            notes: 'Test notes',
            created_at: '2023-01-01T00:00:00Z'
          }
        }
      ];
      
      const mockMediaPlanRecords = [
        {
          id: 'recPlan1',
          fields: {
            plan_id: 'plan-1',
            name: 'Test Plan',
            prompt: 'Test prompt',
            source: 'manual',
            brand: ['recBrand1']
          }
        }
      ];
      
      const mockPostRecords = [
        {
          id: 'recPost1',
          fields: {
            post_id: 'post-1',
            title: 'Test Post',
            platform: 'Instagram',
            content_type: 'image',
            content: 'Test content',
            brand: ['recBrand1'],
            media_plan: ['recPlan1']
          }
        }
      ];
      
      // Mock the fetch functions
      const { findRecordByField, fetchFullRecordsByFormula, fetchLinkedRecords } = require('../services/airtableService');
      (findRecordByField as jest.Mock).mockResolvedValue(mockBrandRecord);
      (fetchLinkedRecords as jest.Mock).mockResolvedValue([]);
      (fetchFullRecordsByFormula as jest.Mock)
        .mockImplementation((tableName: string) => {
          if (tableName === 'Personas') {
            return Promise.resolve(mockPersonaRecords);
          }
          if (tableName === 'Trends') {
            return Promise.resolve(mockTrendRecords);
          }
          if (tableName === 'Media_Plans') {
            return Promise.resolve(mockMediaPlanRecords);
          }
          if (tableName === 'Posts') {
            return Promise.resolve(mockPostRecords);
          }
          return Promise.resolve([]);
        });
      
      const result = await airtableService.loadProjectFromAirtable('brand-123');
      
      // Verify that the functions were called with the correct parameters
      expect(fetchFullRecordsByFormula).toHaveBeenCalledWith('Personas', `{brand} = 'brand-123'`);
      expect(fetchFullRecordsByFormula).toHaveBeenCalledWith('Trends', `{brand} = 'brand-123'`);
      expect(fetchFullRecordsByFormula).toHaveBeenCalledWith('Media_Plans', `{brand} = 'brand-123'`);
      expect(fetchFullRecordsByFormula).toHaveBeenCalledWith('Posts', `{brand} = 'brand-123'`);
      
      // Verify the result structure
      expect(result).toHaveProperty('assets');
      expect(result).toHaveProperty('settings');
      expect(result).toHaveProperty('generatedImages');
      expect(result).toHaveProperty('generatedVideos');
      expect(result).toHaveProperty('brandId', 'brand-123');
    });
  });
});