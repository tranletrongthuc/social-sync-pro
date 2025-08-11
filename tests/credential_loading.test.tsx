import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import App from '../App';
import * as airtableService from '../services/airtableService';

describe('Credential Loading and Project Opening', () => {
  let importMetaEnvSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock import.meta.env
    importMetaEnvSpy = jest.spyOn(window.import.meta, 'env', 'get');

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
    jest.restoreAllMocks(); // Restores all mocks created with spyOn
  });

  it('should open AirtableLoadModal and load project directly if credentials are set', async () => {
    importMetaEnvSpy.mockReturnValue({
      VITE_AIRTABLE_PAT: 'test_pat',
      VITE_AIRTABLE_BASE_ID: 'test_base_id',
      VITE_CLOUDINARY_CLOUD_NAME: 'test_cloud_name',
      VITE_CLOUDINARY_UPLOAD_PRESET: 'test_upload_preset',
    });

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
    importMetaEnvSpy.mockReturnValue({
      VITE_AIRTABLE_PAT: undefined,
      VITE_AIRTABLE_BASE_ID: undefined,
      VITE_CLOUDINARY_CLOUD_NAME: undefined,
      VITE_CLOUDINARY_UPLOAD_PRESET: undefined,
    });

    render(<App />);

    // Expect AirtableLoadModal not to be open initially
    expect(screen.queryByText(/Load Project from Airtable/i)).not.toBeInTheDocument();

    // Expect "Connect Database" button to be visible
    expect(screen.getByRole('button', { name: /Connect Database/i })).toBeInTheDocument();
  });

  it('should open IntegrationModal when "Connect Database" is clicked and credentials are not set', async () => {
    importMetaEnvSpy.mockReturnValue({
      VITE_AIRTABLE_PAT: undefined,
      VITE_AIRTABLE_BASE_ID: undefined,
      VITE_CLOUDINARY_CLOUD_NAME: undefined,
      VITE_CLOUDINARY_UPLOAD_PRESET: undefined,
    });

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Connect Database/i }));

    // Expect IntegrationModal to be open
    expect(await screen.findByText(/Integrations/i)).toBeInTheDocument();
  });
});