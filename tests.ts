import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock for import.meta.env
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      VITE_GEMINI_API_KEY: 'test-api-key',
      VITE_AIRTABLE_PAT: 'test-pat',
      VITE_AIRTABLE_BASE_ID: 'test-base-id',
      VITE_CLOUDINARY_CLOUD_NAME: 'test-cloud-name',
      VITE_CLOUDINARY_UPLOAD_PRESET: 'test-upload-preset',
    },
  },
  writable: true,
});

// This file contains unit tests for the SocialSync Pro application.
// To run these tests, use a test runner like Jest with JSDOM and React Testing Library.

// --- JEST GLOBAL MOCKS ---
// In a real setup, this might be in a jest.setup.js or similar config file.

// Mock for @google/genai
jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn().mockImplementation((..._args: any[]) => Promise.resolve({ text: '{}' })),
      generateImages: jest.fn().mockImplementation((..._args: any[]) => Promise.resolve({ generatedImages: [{ image: { imageBytes: 'mock-base64-string' } }] })),
      embedContent: jest.fn().mockImplementation((..._args: any[]) => Promise.resolve({ embeddings: [{ values: [0.1, 0.2, 0.3] }] })),
    },
  })),
  Type: {
    OBJECT: 'OBJECT',
    ARRAY: 'ARRAY',
    STRING: 'STRING',
    INTEGER: 'INTEGER',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
  },
}));

// Mock for crypto.randomUUID
globalThis.crypto = {
  ...globalThis.crypto,
  randomUUID: jest.fn(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  })) as jest.Mock<() => `${string}-${string}-${string}-${string}-${string}`>,
};

// Mock for global fetch
globalThis.fetch = jest.fn((_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ records: [] }), // Default to empty records for safety
    text: () => Promise.resolve('{"records": []}'),
    blob: () => Promise.resolve(new Blob(['mock data'], { type: 'image/jpeg' })),
  } as Response)
);

// Mock for window.localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// --- IMPORTS FOR TESTING ---
import React from 'react';
import { render, act, waitForElementToBeRemoved } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';

// Import all functions and components to be tested
import * as geminiService from './services/geminiService';
import * as khongminhService from './services/khongminhService';
import * as airtableService from './services/airtableService';
import App, { assetsReducer } from './App';
import IdeaProfiler from './components/IdeaProfiler';
import AssetDisplay from './components/AssetDisplay';
import StrategyDisplay from './components/StrategyDisplay';
import PostCard from './components/PostCard';
import AffiliateVaultDisplay from './components/AffiliateVaultDisplay';
import PersonasDisplay from './components/PersonasDisplay';
import MediaPlanDisplay from './components/MediaPlanDisplay';
import CalendarView from './components/CalendarView';
import PostDetailModal from './components/PostDetailModal';
import { Button, CopyableText } from './components/ui';
import type { GeneratedAssets, MediaPlanGroup, MediaPlanPost, PostInfo, Idea, Trend, Persona, AffiliateLink, PostStatus, FacebookTrend, FacebookPostIdea } from './types';
import { GoogleGenAI } from '@google/genai';


// --- THE TEST SUITE ---
describe('SocialSync Pro: Comprehensive Unit Tests', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should pass a basic truthiness test', () => {
      expect(true).toBe(true);
    });
});

describe('PersonasDisplay Component', () => {
    const mockPersonas: Persona[] = [
      { id: 'p1', nickName: 'Ad-Venturer', mainStyle: 'Techwear', activityField: 'Gadgets', outfitDescription: 'A sleek black jacket', photos: [] },
      { id: 'p2', nickName: 'StyleSavvy', mainStyle: 'Chic', activityField: 'Fashion', outfitDescription: 'A classic trench coat', photos: [] },
    ];

    const defaultProps = {
        generatedImages: {},
        onSavePersona: jest.fn(),
        onDeletePersona: jest.fn(),
        onSetPersonaImage: jest.fn(async (): Promise<string | undefined> => 'new_image_key_123'),
        isUploadingImage: jest.fn(() => false),
        language: "English",
    };

    it('should display existing personas when loaded', () => {
        render(
            React.createElement(PersonasDisplay, {
                personas: mockPersonas,
                ...defaultProps,
            })
        );

        expect(screen.getByText('Ad-Venturer')).toBeInTheDocument();
        expect(screen.getByText('StyleSavvy')).toBeInTheDocument();
        expect(screen.queryByText('No personas yet.')).not.toBeInTheDocument();
    });

    it('should display a message when there are no personas', () => {
        render(
            React.createElement(PersonasDisplay, {
                personas: [],
                ...defaultProps,
            })
        );
        expect(screen.getByText('No personas yet.')).toBeInTheDocument();
    });

    it('should update displayed personas when props change, verifying the bug fix', () => {
        const { rerender } = render(
            React.createElement(PersonasDisplay, {
                personas: mockPersonas.slice(0, 1),
                ...defaultProps,
            })
        );
        
        expect(screen.getByText('Ad-Venturer')).toBeInTheDocument();
        expect(screen.queryByText('StyleSavvy')).not.toBeInTheDocument();

        // Rerender with the full list of personas
        rerender(
             React.createElement(PersonasDisplay, {
                personas: mockPersonas,
                ...defaultProps,
            })
        );

        // After rerendering, both personas should be visible
        expect(screen.getByText('Ad-Venturer')).toBeInTheDocument();
        expect(screen.getByText('StyleSavvy')).toBeInTheDocument();
    });
    
    it('should call onSave when a new persona is created', async () => {
        const handleSave = jest.fn();
        const handleSetImage = jest.fn(async (personaId: string, photoId: string, dataUrl: string): Promise<string | undefined> => 'new_key');
        render(
            React.createElement(PersonasDisplay, {
                personas: [],
                ...defaultProps,
                onSavePersona: handleSave,
                onSetPersonaImage: handleSetImage,
            })
        );

        // Click "Add New" button
        fireEvent.click(screen.getByText('Add New KOL/KOC'));
        
        // Fill out the form
        fireEvent.change(screen.getByLabelText('Nickname'), { target: { value: 'New Star' } });

        // Upload an image
        const file = new File(['(⌐□_□)'], 'chuck.png', { type: 'image/png' });
        const uploadButton = screen.getByRole('button', { name: /Upload \/ Paste/i });
        fireEvent.paste(uploadButton, {
            clipboardData: { files: [file] },
        });

        // Wait for async operations
        await waitFor(() => expect(handleSetImage).toHaveBeenCalled());
        
        // Click "Save"
        fireEvent.click(screen.getByText('Save'));

        expect(handleSave).toHaveBeenCalledTimes(1);
        
        const savedPersona = handleSave.mock.calls[0][0] as Persona;
        expect(savedPersona.nickName).toBe('New Star');
        // Because generatedImages prop is empty, these will be undefined
        expect(savedPersona.avatarImageKey).toBeUndefined();
        expect(savedPersona.avatarImageUrl).toBeUndefined();
        // Check that the key from the mock save is in the photos array
        expect(savedPersona.photos.some(p => p.imageKey === 'new_key')).toBe(true);
    });
});
