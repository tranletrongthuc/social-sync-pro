import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import App from '../App';
import * as airtableService from '../services/airtableService';

jest.mock('../services/airtableService');

describe('Project Loading Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load project correctly', async () => {
    const mockAssets = {
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
    };

    (airtableService.loadProjectFromAirtable as jest.Mock).mockResolvedValue({
      assets: mockAssets,
      settings: {},
      generatedImages: {},
      generatedVideos: {},
      brandId: 'brand1',
    });

    render(<App />);

    // Assuming the app starts with a loading state, then shows the project list
    // You might need to adjust the selectors based on your actual UI
    await waitFor(() => {
      expect(screen.getByText('Test Brand 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Brand 1'));

    await waitFor(() => {
      expect(airtableService.loadProjectFromAirtable).toHaveBeenCalledWith('brand1');
    });

    await waitFor(() => {
      expect(screen.getByText(/Brand Kit/i)).toBeInTheDocument();
    });
  });
});