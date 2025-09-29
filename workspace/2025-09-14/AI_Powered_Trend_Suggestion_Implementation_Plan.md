# AI-Powered Trend Suggestion Implementation Plan

## Overview
This document outlines the implementation plan for the AI-Powered Trend Suggestion feature described in the SocialSync Pro Feature Descriptions document. This feature will automatically search the internet to discover and save up to 10 relevant trends, supporting both niche industry trends and broader global hot trends.

## Technical Architecture

### Backend Implementation
1. **API Endpoint Creation**
   - Add new actions to `api/gemini.js`:
     - `suggest-trends` - for industry-specific trends
     - `suggest-global-trends` - for global hot trends
   - Both endpoints will use the existing BFF pattern

2. **Prompt Engineering**
   - Create prompt templates for both trend types in the prompt builder
   - Implement proper JSON structure for trend objects

3. **Response Processing**
   - Add response processors for the new trend suggestion endpoints
   - Ensure proper validation and error handling

### Frontend Implementation
1. **Service Layer**
   - Add new functions to `textGenerationService.ts`:
     - `suggestTrends()` - for industry-specific trends
     - `suggestGlobalTrends()` - for global hot trends
   - Add corresponding functions to provider services (Gemini and OpenRouter)

2. **UI Components**
   - Update `StrategyDisplay.tsx` to include:
     - Dropdown for trend type selection ("Industry Specific" or "Global Hot Trends")
     - Dropdown for time period selection
     - "Suggest Trends" button
   - Add loading states and error handling

3. **State Management**
   - Extend `useStrategyManagement.ts` hook with:
     - New handler functions for trend suggestion
     - Loading and error states for the new feature

## Detailed Implementation Steps

### 1. Backend API Implementation

#### 1.1. Add Actions to `api/gemini.js`
- Add `suggest-trends` action that:
  - Accepts brand profile, time period, and model
  - Constructs appropriate prompt using brand information
  - Enables internet search for compatible models
  - Returns JSON array of trend objects

- Add `suggest-global-trends` action that:
  - Accepts time period and model only
  - Constructs prompt for global trends
  - Enables internet search for compatible models
  - Returns JSON array of trend objects

#### 1.2. Prompt Templates
- Create new prompt templates in `prompt.builder.ts`:
  - `buildSuggestTrendsPrompt()` for industry-specific trends
  - `buildSuggestGlobalTrendsPrompt()` for global trends

#### 1.3. Response Processing
- Add new response processors in `response.processor.ts`:
  - `processSuggestTrendsResponse()`
  - `processSuggestGlobalTrendsResponse()`

### 2. Frontend Service Implementation

#### 2.1. Text Generation Service
- Add new functions to `textGenerationService.ts`:
  ```typescript
  const suggestTrends = (
    params: { brandFoundation: BrandFoundation, timePeriod: string, settings: Settings },
    aiModelConfig: AiModelConfig
  ): Promise<Omit<Trend, 'id' | 'brandId'>[]> => { ... }

  const suggestGlobalTrends = (
    params: { timePeriod: string, settings: Settings },
    aiModelConfig: AiModelConfig
  ): Promise<Omit<Trend, 'id' | 'brandId'>[]> => { ... }
  ```

#### 2.2. Provider Services
- Add corresponding functions to `geminiService.ts` and `openrouterService.ts`:
  - `suggestTrendsWithGemini()`
  - `suggestGlobalTrendsWithGemini()`
  - `suggestTrendsWithOpenRouter()`
  - `suggestGlobalTrendsWithOpenRouter()`

### 3. UI Component Updates

#### 3.1. StrategyDisplay Component
- Add new section for "Auto-Suggest Trends" above existing trend search
- Include:
  - Trend type dropdown ("Industry Specific" or "Global Hot Trends")
  - Time period dropdown (e.g., "Last Week", "Last Month", "Last 3 Months")
  - "Suggest Trends" button
  - Loading indicator during processing
  - Error display for failures

#### 3.2. State Management
- Extend `useStrategyManagement.ts` with:
  - `handleSuggestTrends()` function that:
    - Calls appropriate service function based on trend type
    - Processes returned trends
    - Saves trends to database using existing `saveTrendToDatabase()`
    - Updates UI with new trends

## Data Flow

1. User selects trend type and time period in UI
2. User clicks "Suggest Trends" button
3. Handler in `useStrategyManagement` determines which function to call:
   - If "Industry Specific", calls `textGenerationService.suggestTrends()`
   - If "Global Hot Trends", calls `textGenerationService.suggestGlobalTrends()`
4. Service function constructs prompt using appropriate template from settings
5. For compatible models, enables internet search
6. Service determines correct provider (Google, OpenRouter) and calls provider-specific function
7. Provider service calls backend endpoint (e.g., `/api/gemini?action=suggest-trends`)
8. Backend executes request and returns AI response as JSON string
9. Frontend service parses JSON response into list of trend objects
10. Frontend calls `/api/mongodb?action=save-trend` for each suggested trend
11. UI automatically refreshes trend list with new AI-suggested trends

## Error Handling

- Handle API errors gracefully with user-friendly messages
- Implement retry logic for transient failures
- Validate trend objects before saving to database
- Provide clear feedback on success/failure

## Testing Plan

1. Unit tests for prompt builders
2. Integration tests for API endpoints
3. UI tests for component interactions
4. End-to-end tests for complete workflow
5. Error condition testing