# Plan: Remove Synchronous Generative Functions

**Difficulty:** A

**Objective:** Refactor the codebase to remove all synchronous generative AI functions from the frontend (`src/services`) and consolidate the logic within the backend (`server_lib`).

---

## Phase 1: Analysis - Identify Redundant Logic

1.  **Analyze `src/services/prompt.builder.ts`:**
    - Compare with `server_lib/promptBuilder.js`.
    - Identify all prompt-building functions that have been migrated.
    - Expected to be removed: `buildMediaPlanPrompt`, `buildGenerateBrandProfilePrompt`, `buildBrandKitPrompt`, `buildSuggestTrendsPrompt`, etc.

2.  **Analyze `src/services/response.processor.ts`:**
    - Compare with `server_lib/responseProcessor.js`.
    - Identify all response-processing functions that have been migrated.
    - Expected to be removed: `processMediaPlanResponse`, `processBrandProfileResponse`, `processBrandKitResponse`, `processViralIdeasResponse`, etc.

3.  **Analyze `src/services/textGenerationService.ts`:**
    - This file likely orchestrates synchronous calls.
    - Identify functions like `generateMediaPlanGroup`, `generateBrandProfile`. These are now handled by `server_lib/generationService.js`.
    - The entire file might be removable if all its functions are now obsolete.

4.  **Analyze `src/services/geminiService.ts` and `src/services/openrouterService.ts`:**
    - These files likely contain direct, client-side calls to the backend API endpoints.
    - This functionality is now centralized in `server_lib/aiService.js`, `server_lib/geminiClient.js`, and `server_lib/openrouterClient.js`.
    - These files are likely candidates for complete removal.

5.  **Trace Frontend Usage:**
    - Search through `src/hooks`, `src/components`, and `src/App.tsx` to find any remaining calls to the synchronous functions identified above.
    - All calls should be replaced with calls to `taskService.createTask`. (This should already be the case, but verification is necessary).

---

## Phase 2: Implementation - Refactor & Clean Up

1.  **Delete Redundant Files:**
    - Based on the analysis, delete entire files from `src/services` that are no longer needed.
    - Tentative deletion list:
        - `src/services/textGenerationService.ts`
        - `src/services/geminiService.ts`
        - `src/services/openrouterService.ts`
        - `src/services/prompt.builder.ts`
        - `src/services/response.processor.ts`

2.  **Clean Up Imports:**
    - After deleting the files, search the codebase for any lingering imports pointing to them and remove them. This will likely affect `src/hooks` and `src/App.tsx`.

---

## Phase 3: Verification

1.  **TypeScript Check:**
    - Run `npx tsc --noEmit` to ensure the refactoring has not introduced any type errors.

2.  **Build Project:**
    - Run `npm run build` to confirm that the application still builds successfully.

3.  **Manual Test Plan (for user):**
    - Generate a Media Plan.
    - Create a new Brand from an Idea.
    - Suggest Trends.
    - Generate Viral Ideas.
    - All these actions should create tasks in the Task Manager and complete successfully.
