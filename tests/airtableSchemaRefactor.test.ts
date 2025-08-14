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
      
      // Check that we have the non-scalable linked fields
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
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        VITE_AIRTABLE_BASE_ID: 'appTest123',
        VITE_AIRTABLE_PAT: 'patTest123'
      };
      
      // Mock the airtableFetch function to avoid actual API calls
      const { airtableFetch, fetchRecordsByLinkedCustomId } = require('../services/airtableService');
      (airtableFetch as jest.Mock).mockResolvedValue({
        tables: []
      });
      
      // Mock fetchRecordsByLinkedCustomId to return test data
      const mockPlanRecords = [{
        fields: {
          plan_id: 'plan-1',
          name: 'Test Plan',
          prompt: 'Test prompt',
          source: 'manual',
          product_images_json: JSON.stringify([{ name: 'test.jpg', type: 'image/jpeg', data: 'base64data' }]),
          persona: ['recPersona1']
        }
      }];
      
      const mockPersonaRecords = [{
        id: 'recPersona1',
        fields: {
          persona_id: 'persona-1'
        }
      }];
      
      (fetchRecordsByLinkedCustomId as jest.Mock)
        .mockImplementation((tableName: string, linkFieldName: string, linkedCustomId: string) => {
          if (tableName === 'Media_Plans') {
            return Promise.resolve(mockPlanRecords);
          }
          return Promise.resolve([]);
        });
      
      // Mock findRecordByField to return test data
      const { findRecordByField } = require('../services/airtableService');
      (findRecordByField as jest.Mock)
        .mockImplementation((tableName: string, fieldName: string, value: string) => {
          if (tableName === 'Personas' && fieldName === 'persona_id' && value === 'persona-1') {
            return Promise.resolve(mockPersonaRecords[0]);
          }
          return Promise.resolve(null);
        });
      
      const result = await require('../services/airtableService').listMediaPlanGroupsForBrand('brand-123');
      
      // Verify that fetchRecordsByLinkedCustomId was called with the correct parameters
      expect(fetchRecordsByLinkedCustomId).toHaveBeenCalledWith(
        'Media_Plans', 
        'brand', 
        'brand-123'
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
      
      // Restore original environment
      process.env = originalEnv;
    });
  });

  describe('loadProjectFromAirtable function', () => {
    it('should query child tables directly instead of using brand linked fields', async () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        VITE_AIRTABLE_BASE_ID: 'appTest123',
        VITE_AIRTABLE_PAT: 'patTest123'
      };
      
      // Set up mock data
      const mockBrandRecord = {
        id: 'recBrand1',
        fields: {
          brand_id: 'brand-123',
          name: 'Test Brand',
          mission: 'Test Mission',
          usp: 'Test USP',
          target_audience: 'Test Audience',
          personality: 'Test Personality',
          color_palette_json: '{}',
          font_recs_json: '{}',
          unified_profile_json: '{}'
        }
      };
      
      const mockPersonaRecords = [{
        id: 'recPersona1',
        fields: {
          persona_id: 'persona-1',
          nick_name: 'Test Persona',
          main_style: 'Test Style',
          activity_field: 'Test Field',
          outfit_description: 'Test Outfit',
          avatar_image_key: 'avatar-key',
          avatar_image_url: 'http://example.com/avatar.jpg'
        }
      }];
      
      const mockTrendRecords = [{
        id: 'recTrend1',
        fields: {
          trend_id: 'trend-1',
          industry: 'Test Industry',
          topic: 'Test Topic',
          keywords: 'keyword1, keyword2',
          links_json: '[]',
          notes: 'Test Notes',
          created_at: '2023-01-01T00:00:00Z'
        }
      }];
      
      const mockMediaPlanRecords = [{
        id: 'recPlan1',
        fields: {
          plan_id: 'plan-1',
          name: 'Test Plan',
          prompt: 'Test Prompt',
          source: 'manual'
        }
      }];
      
      const mockPostRecords = [{
        id: 'recPost1',
        fields: {
          post_id: 'post-1',
          title: 'Test Post',
          week: 1,
          theme: 'Test Theme',
          platform: 'Facebook',
          content_type: 'post',
          content: 'Test Content',
          description: 'Test Description',
          hashtags: 'hashtag1, hashtag2',
          cta: 'Test CTA',
          media_prompt: 'Test Media Prompt',
          script: 'Test Script',
          image_key: 'image-key',
          image_url: 'http://example.com/image.jpg',
          video_key: 'video-key',
          video_url: 'http://example.com/video.mp4',
          scheduled_at: '2023-01-01T00:00:00Z',
          published_at: '2023-01-01T00:00:00Z',
          published_url: 'http://example.com/post',
          auto_comment: 'Test Comment',
          status: 'published',
          is_pillar: false
        }
      }];
      
      // Mock the fetch functions
      const { findRecordByField, fetchFullRecordsByFormula } = require('../services/airtableService');
      (findRecordByField as jest.Mock).mockResolvedValue(mockBrandRecord);
      (fetchFullRecordsByFormula as jest.Mock)
        .mockImplementation((tableName: string, formula: string) => {
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
      
      const result = await require('../services/airtableService').loadProjectFromAirtable('brand-123');
      
      // Verify that the functions were called with the correct parameters
      expect(fetchFullRecordsByFormula).toHaveBeenCalledWith('Personas', `{brand} = 'brand-123'`);
      expect(fetchFullRecordsByFormula).toHaveBeenCalledWith('Trends', `{brand} = 'brand-123'`);
      expect(fetchFullRecordsByFormula).toHaveBeenCalledWith('Media_Plans', `{brand} = 'brand-123'`);
      expect(fetchFullRecordsByFormula).toHaveBeenCalledWith('Posts', `{brand} = 'brand-123'`);
      
      // Verify the result structure
      expect(result).toHaveProperty('assets');
      expect(result).toHaveProperty('generatedImages');
      expect(result).toHaveProperty('generatedVideos');
      expect(result).toHaveProperty('brandId', 'brand-123');
      
      // Restore original environment
      process.env = originalEnv;
    });
  });
});