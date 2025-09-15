# Carousel Generation Batch Update Plan

## 1. Specification

*   **1.1. What & Why:** The current method of saving carousel images one by one is causing race conditions and data corruption. This plan outlines a refactor to a batch update model, where all images are generated in parallel and then saved to the database in a single, atomic transaction. This will improve reliability and performance.
*   **1.2. Difficulty:** A

## 2. Technical Plan

*   **Objective:** Implement a reliable batch update system for carousel image generation.
*   **Architecture:**
    1.  The client-side (`CarouselPostHandler`) will trigger the generation of all images concurrently using `Promise.all`.
    2.  The results (an array of new URLs and keys) will be collected.
    3.  A single API request will be sent to the backend containing the complete, updated arrays.
    4.  The backend (`api/mongodb.js`) will perform a single `updateOne` operation, using `$set` to replace the `imageUrlsArray` and `imageKeys` fields entirely.

## 3. Task Breakdown

### Phase 1: Backend Refactoring (`api/mongodb.js`)
- Modify the `update-media-plan-post` handler to accept optional `imageUrlsArray` and `imageKeys` arrays.
- If these arrays are present in the request body, the MongoDB `$set` operation should include them to overwrite the existing database fields.

### Phase 2: Service & Hook Refactoring
- **`databaseService.ts`:** Modify `updateMediaPlanPostInDatabase` to accept the full `imageUrlsArray` and `imageKeys` and pass them in the request body.
- **`useAssetManagement.ts`:**
    - Create a new function `handleGenerateAllCarouselImages(postInfo: PostInfo)`.
    - This function will:
        - Contain the `Promise.all` logic to generate all images.
        - Collect the results into `newImageUrls` and `newImageKeys` arrays.
        - Call `updateMediaPlanPostInDatabase` once with the complete arrays.
        - Dispatch a new reducer action (`UPDATE_POST_CAROUSEL`) to update the client-side state in one go.
- **`assetsReducer.ts`:** Add the `UPDATE_POST_CAROUSEL` action handler.

### Phase 3: UI Refactoring (`PostDetailModal.tsx`)
- The `onGenerateImage` prop will no longer be used by the "Generate All" button.
- A new prop, `onGenerateAllCarouselImages`, will be passed to the `PostDetailModal`.
- The `handleGenerateAll` function inside `CarouselPostHandler` will be simplified to just call `props.onGenerateAllCarouselImages(props.postInfo)`.
