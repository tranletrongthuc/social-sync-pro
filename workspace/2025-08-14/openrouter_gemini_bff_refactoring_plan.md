# OpenRouter and Gemini Service Refactoring Plan

## Overview
This document outlines the plan to refactor both OpenRouter and Gemini services to exclusively use the BFF (Backend for Frontend) service, removing all direct API calls from the client-side code. This will improve security by keeping API keys server-side and centralize error handling.

## Current Architecture Issues
1. Both services make direct API calls from the client
2. Only partial BFF integration exists (fallback mechanisms)
3. API keys are exposed in client-side code
4. Rate limiting and error handling is duplicated

## Refactored Architecture
1. All AI requests will go through the BFF service
2. Client-side code will only make requests to our own backend
3. BFF service will handle all external API communication
4. Centralized error handling and rate limiting

## Implementation Steps

### 1. OpenRouter Service Refactoring (`services/openrouterService.ts`)

**Remove:**
- `openrouterFetch` function and all direct API calls
- All rate limiting and retry logic (handled by BFF)
- Error handling (handled by BFF)

**Keep:**
- Service interface functions that will call BFF
- Type definitions and model validation

**Modify:**
- All service functions to use `bffService` instead of direct calls
- Update function signatures to match BFF endpoints

### 2. Gemini Service Refactoring (`services/geminiService.ts`)

**Remove:**
- Direct `GoogleGenAI` instantiation
- All direct API calls to Gemini
- Retry mechanisms and rate limiting (handled by BFF)
- Fallback logic to direct calls

**Keep:**
- Service interface functions that will call BFF
- JSON parsing and sanitization functions
- Type definitions

**Modify:**
- Functions to exclusively use `bffService` for all requests
- Update function signatures to match BFF endpoints

### 3. BFF Service Enhancements (`services/bffService.ts`)

**Add:**
- New endpoints for OpenRouter functionality
- Enhanced error handling and logging
- Rate limiting coordination
- Response validation

### 4. Server-side Implementation (`server/index.js`)

**Add:**
- OpenRouter API proxy endpoints
- Enhanced Gemini API endpoints
- Rate limiting and error handling
- API key management

## Detailed Changes

### OpenRouter Service Changes

1. **Remove `openrouterFetch`** - All direct API calls will be handled by BFF
2. **Refactor all service functions** to use BFF endpoints:
   ```typescript
   // Before
   const response = await openrouterFetch({ model: model, ... })
   
   // After
   const response = await generateContentWithBff(model, contents, config)
   ```

3. **Remove retry logic** - BFF will handle retries and rate limiting

### Gemini Service Changes

1. **Remove direct `GoogleGenAI` instantiation** - BFF will handle all API communication
2. **Refactor functions** to exclusively use BFF:
   ```typescript
   // Before
   const ai = new GoogleGenAI({ apiKey });
   const response = await ai.models.generateContent({ ... })
   
   // After
   const response = await generateContentWithBff(model, contents, config)
   ```

3. **Remove fallback mechanisms** - BFF is the only communication path

### BFF Service Enhancements

1. **Add OpenRouter endpoints**:
   - `/api/openrouter/generate` for text generation
   - `/api/openrouter/generate-image` for image generation

2. **Enhance existing Gemini endpoints**:
   - Improve error handling
   - Add rate limiting coordination
   - Add better logging

### Server Implementation

1. **Add OpenRouter API proxy**:
   - Endpoint for text generation
   - Endpoint for image generation
   - Proper error handling and response formatting

2. **Enhance Gemini proxy**:
   - Add rate limiting
   - Improve error responses
   - Add logging

## Benefits of This Refactoring

1. **Security**: API keys never exposed to client
2. **Maintainability**: Centralized API communication logic
3. **Scalability**: Better rate limiting and error handling
4. **Observability**: Centralized logging and monitoring
5. **Reliability**: Consistent error handling and retry mechanisms

## Testing Approach

1. **Unit Tests**: Verify BFF service functions correctly
2. **Integration Tests**: Ensure client can communicate with BFF
3. **End-to-End Tests**: Validate complete AI functionality
4. **Error Handling Tests**: Verify proper error responses

## Rollout Strategy

1. **Phase 1**: Implement BFF endpoints and server-side logic
2. **Phase 2**: Refactor client-side services to use BFF exclusively
3. **Phase 3**: Remove unused direct API call code
4. **Phase 4**: Update documentation and run final tests