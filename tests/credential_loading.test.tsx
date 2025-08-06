import React from 'react';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import App from '../App';
import * as airtableService from '../services/airtableService';

// Mock import.meta.env for testing purposes
const mockViteEnv = (airtablePat: string | undefined, airtableBaseId: string | undefined, cloudinaryCloudName: string | undefined, cloudinaryUploadPreset: string | undefined) => {
  Object.defineProperty(import.meta, 'env', {
    value: {
      VITE_AIRTABLE_PAT: airtablePat,
      VITE_AIRTABLE_BASE_ID: airtableBaseId,
      VITE_CLOUDINARY_CLOUD_NAME: cloudinaryCloudName,
      VITE_CLOUDINARY_UPLOAD_PRESET: cloudinaryUploadPreset,
      // Add other VITE_ prefixed environment variables as needed for tests
    },
    writable: true,
  });
};

describe('Credential Loading and Project Opening', () => {
  let originalMetaEnv: ImportMetaEnv;

  beforeEach(() => {
    // Save the original import.meta.env
    originalMetaEnv = { ...import.meta.env };
    jest.clearAllMocks();
    // Mock listBrandsFromAirtable and loadProjectFromAirtable
    jest.spyOn(airtableService, 'listBrandsFromAirtable').mockResolvedValue([
      { id: 'brand1', name: 'Test Brand 1' },
      { id: 'brand2', name: 'Test Brand 2' },
    ]);
    jest.spyOn(airtableService, 'loadProjectFromAirtable').mockResolvedValue({
      assets: {
        brandFoundation: {
          brandName: 'Test Brand 1',
          mission: 'Test Mission',
          values: ['Value 1'],
          targetAudience: 'Audience',
          personality: 'Personality',
          keyMessaging: ['Message 1'],
          usp: 'USP',
        },
        coreMediaAssets: {
          logoConcepts: [],
          colorPalette: {},
          fontRecommendations: {},
        },
        unifiedProfileAssets: {
          accountName: 'account',
          username: 'username',
          profilePicturePrompt: 'prompt',
          coverPhoto: { prompt: 'prompt', designConcept: 'concept' },
        },
        mediaPlans: [],
        affiliateLinks: [],
        personas: [],
        trends: [],
        ideas: [],
      },
      settings: {},
      generatedImages: {},
      generatedVideos: {},
      brandId: 'brand1',
    });
  });

  afterEach(() => {
    // Restore the original import.meta.env
    Object.defineProperty(import.meta, 'env', {
      value: originalMetaEnv,
      writable: true,
    });
  });

  it('should open AirtableLoadModal and load project directly if credentials are set', async () => {
    mockViteEnv('test_pat', 'test_base_id', 'test_cloud_name', 'test_upload_preset');

    render(<App />);

    // Expect AirtableLoadModal to be open initially
    expect(await screen.findByText(/Load Project from Airtable/i)).toBeInTheDocument();

    // Simulate selecting a brand
    fireEvent.click(screen.getByText('Test Brand 1'));

    // Expect the project to load and the modal to disappear
    await waitFor(() => {
      expect(screen.queryByText(/Load Project from Airtable/i)).not.toBeInTheDocument();
    });

    // Verify that MainDisplay is rendered (by checking for a common element in MainDisplay)
    // This assumes MainDisplay renders a header or similar element with "Brand Kit" text
    expect(screen.getByText(/Brand Kit/i)).toBeInTheDocument();
  });

  it('should display "Connect Database" button if credentials are not set', async () => {
    mockViteEnv(undefined, undefined, undefined, undefined);

    render(<App />);

    // Expect AirtableLoadModal not to be open initially
    expect(screen.queryByText(/Load Project from Airtable/i)).not.toBeInTheDocument();

    // Expect "Connect Database" button to be visible
    expect(screen.getByRole('button', { name: /Connect Database/i })).toBeInTheDocument();
  });

  it('should open IntegrationModal when "Connect Database" is clicked and credentials are not set', async () => {
    mockViteEnv(undefined, undefined, undefined, undefined);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Connect Database/i }));

    // Expect IntegrationModal to be open
    expect(await screen.findByText(/Integrations/i)).toBeInTheDocument();
  });
});
