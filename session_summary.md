Session Summary (2025-08-31)
---

### 1. Summary of Accomplishments

Over this session, we have performed a significant refactoring of the project's backend API and frontend services with the following key achievements:

*   **API Route Consolidation**	To stay within the Vercel Hobby plan limits, all API routes under the `/api` directory were consolidated. Instead of multiple files, we now have one file per service (`mongodb.js`, `gemini.js`, `openrouter.js`, etc.) that uses an `?action=` query parameter to differentiate between operations.
*   **Database ID Refactoring**	The MongoDB save/update logic in `api/mongodb.js` was refactored to ensure that a custom `id` field (stored as a string) is always created and aligned with the value of the native `_id` (ObjectID). This creates a consistent and predictable ID structure across all collections.
*   **Database Service Consolidation**	All frontend database service logic, which was previously split between `databaseService.ts` and `mongodbStrategyService.ts`, has been merged into a single, comprehensive `databaseService.ts` file for improved maintainability.
*   **Code Cleanup**	All old, redundant API and service files have been deleted, leaving a much cleaner and more organized project structure.

### 2. Current Project Structure

Here is the updated structure of the key directories we have modified:

**API Directory (`/api`):**
```
/api
├── lib/
│   ├── airtable.js
│   ├── cors.js
│   └── mongodb.js
├── cloudflare.js
├── cloudinary.js
├── facebook.js
├── gemini.js
├── health.js
├── index.js
├── mongodb.js
└── openrouter.js
```

**Services Directory (`/src/services`):**
```
/src/services
├── bffService.ts
├── cloudflareService.ts
├── cloudinaryService.ts
├── configService.ts
├── databaseService.ts
├── exportService.ts
├── facebookService.ts
├── geminiService.ts
├── khongminhService.ts
├── lazyLoadService.ts
├── openrouterService.ts
├── socialAccountService.ts
├── socialApiService.ts
└── textGenerationService.ts
```

### 3. Key File Contents

The provided code consists of three main files that handle server-side logic and API interactions for a web application.

---

### `/api/mongodb.js`

This file is a **Node.js API endpoint** for a MongoDB database. It functions as a single entry point for all database operations, using a `switch` statement based on a query parameter called `action`. This central handler architecture consolidates data access logic.

Key functionalities include:

* **Data Management:** Operations to save, load, update, and delete records across various collections like `brands`, `mediaPlanGroups`, `mediaPlanPosts`, `personas`, `affiliateProducts`, `trends`, and `ideas`.
* **Bulk Operations:** Uses `bulkWrite` for efficiency when performing multiple update or insert operations, such as saving a list of ideas or patching multiple posts.
* **ID Handling:** A helper function `createIdFilter` handles converting string IDs from the client into `ObjectId` types, which are the native format for MongoDB's `_id` field.
* **Settings and AI Services:** It manages application settings and information about AI services and models in dedicated collections (`adminSettings`, `brandSettings`, `aiServices`, `aiModels`).
* **Error Handling:** It includes `try...catch` blocks to handle errors and returns appropriate HTTP status codes (e.g., `400` for bad requests, `405` for unsupported methods, `500` for server errors).

---

### `/api/gemini.js`

This file is a **Node.js API endpoint** that acts as a middleware for the Google Gemini API. It encapsulates the logic for making calls to Gemini's generative AI models.

Key functionalities include:

* **Text Generation:** The `generate` action takes a model and content to generate a text response.
* **Image Generation:** The `generate-image` action uses Gemini to create an image based on a text prompt.
* **Embeddings:** The `embed` action generates vector embeddings for given text inputs, which is useful for tasks like semantic search and content similarity.
* **API Key Management:** It checks for the `GEMINI_API_KEY` environment variable and throws an error if it's missing, ensuring sensitive data isn't exposed.

---

### `/src/services/databaseService.ts`

This file is a **TypeScript service** for the client-side application. It provides a structured interface for interacting with the `/api/mongodb` API.

Key functionalities include:

* **API Call Abstraction:** It abstracts the low-level `fetch` calls to the `/api/mongodb` endpoint, making it easier for the rest of the application to interact with the database.
* **Caching:** It implements a simple in-memory cache (`dataCache`) to prevent redundant API calls for the same data, improving performance.
* **Named Functions:** It exports functions with clear, descriptive names (e.g., `saveSettings`, `loadMediaPlanGroupsList`) that map to the `action` parameter used in the `/api/mongodb` endpoint.
* **Error Propagation:** It wraps API calls in `try...catch` blocks and re-throws errors to be handled by the UI layer.

---

### `/src/services/bffService.ts`

This file is a **TypeScript service** that acts as a "Backend for Frontend" (BFF) layer, providing a single point of contact for the client to interact with various third-party APIs like Gemini, OpenRouter, and Cloudflare, as well as the internal database API.

Key functionalities include:

* **Centralized API Access:** It consolidates calls to different back-end services, making it easier for the client to manage API interactions.
* **Standardized Fetching:** The `bffFetch` helper function provides a consistent way to make API calls with standardized headers and error handling.
* **Service-Specific Functions:** It exports functions for each external service (e.g., `generateContentWithBff` for Gemini, `publishToFacebookWithBff` for Facebook), abstracting away the specific API endpoint URLs.

Session Summary (2025-09-01)

The bug preventing new brand kits from saving was caused by a **stale state closure** and **silent failure**. 🐞 The `ensureMongoProject` function, a `useCallback` hook, had a missing dependency: the `areCredentialsSet` state variable. This caused the function to retain an outdated `false` value for the credentials status.

***

### Bug Fixes

The `handleGenerateKit` function failed to check the return value of `ensureMongoProject`. Since the latter was returning `null` due to the stale state, the save operation was silently skipped.

* **Dependency Array Update**: To fix this, `areCredentialsSet` was added to the dependency array of the `ensureMongoProject` `useCallback` hook. This ensures the function re-creates itself with the latest `areCredentialsSet` value.

* **Improved Error Handling**: The `handleGenerateKit` function was updated to check for a `null` return value from `ensureMongoProject`. If `null` is returned, a non-blocking toast notification now informs the user that the generated content was not saved to the database due to missing credentials.

The primary file affected was **src/App.tsx**, where the state management and error-handling logic were corrected.

Session Summary (2025-09-02)
### Backend and Frontend Refactoring

The backend and frontend of the application have been refactored to streamline the "brand kit" generation feature. The core change involves **consolidating four separate MongoDB collections** (`brandSettings`, `brandValues`, `keyMessages`, and `logoConcepts`) into a single, main **`brands` collection**.

---

### Key Technical Changes

#### Backend (API)
* **MongoDB Schema:** The `brands` collection now stores all brand-related data, including settings, values, key messages, and logo concepts, within a single document for each brand.
* **API Endpoints:** The API has been updated to use this new, unified data structure.
    * The `create-or-update-brand` endpoint now accepts and saves all brand data in a single call.
    * Endpoints like `fetch-settings`, `save-settings`, `load-complete-project`, and `initial-load` have been modified to query for and retrieve data from the consolidated `brands` collection.
* **Database Consistency:** Database queries have been standardized to use the `_id` field instead of a custom `brandId` to fix an underlying BSONError, ensuring consistent data retrieval and manipulation.

---

#### Frontend (UI)
* **Data Service:** The `databaseService.ts` file has been refactored to align with the new API structure. It now sends and receives the complete, consolidated brand object and no longer contains separate functions for handling individual brand data like settings.
* **UI Components:**
    * **`SettingsModal.tsx`**: This component was changed from a stateful component that fetched its own data to a "dumb" component. It now receives the `settings` object and a save function (`onSave`) as props from a parent component, making it more reusable.
    * **`App.tsx`**: The main application component now manages the `settings` state. It includes a new `handleSaveSettings` function that updates the entire `generatedAssets` state object and then calls `createOrUpdateBrandRecord` to persist the changes to the database.
    * **`BrandProfiler.tsx` and `AssetDisplay.tsx`**: These components required no changes as they were already designed to handle the consolidated data structure.


### Database Cleanup and Bug Fix
* A bug that caused a **`BSONError`** during new brand generation was identified and fixed. The issue was traced to the `ensureMongoProject` function in `App.tsx`, which was passing an incorrect argument to the backend's `createOrUpdateBrandRecord` function. The corrected code ensures that image URLs are properly populated in the assets object before it is sent to the database.
* A subsequent frontend error (`handleSaveSettings is not defined`) was identified as a scope issue in `App.tsx`. The `handleSaveSettings` function has been corrected to use the `useCallback` hook, ensuring it is properly defined and accessible to child components.

The refactoring and fixes are complete, simplifying the database schema and improving the reliability of the brand generation process.

* Bug Triage & Analysis:
      * The initial problem was an Uncaught ReferenceError: handleSaveSettings is not defined originating from App.tsx. This occurred when the SettingsModal component was rendered, as it was passed a non-existent handler for its onSave prop.
      * This led to a follow-up Uncaught SyntaxError after the handler was created, because the underlying saveSettings function it called was not exported from the databaseService.ts module.

* Fix Implementation:
    * `App.tsx` Modifications:
        * A new handleSaveSettings function was implemented using the useCallback hook.
        * This handler was wired to call saveSettings (for brand-specific settings) or saveAdminDefaults (for global settings) from the database service.
        * The databaseService import statement was updated to include saveSettings and saveAdminDefaults.
    * `databaseService.ts` Modifications:
        * A new function, saveSettingsToDatabase, was created. This function makes a fetch call to the backend API endpoint /api/mongodb?action=save-settings, passing the settings object and the brandId.
        * The new saveSettingsToDatabase function was exported with the public alias saveSettings to satisfy the import in App.tsx.

* Outcome:
    * The application-crashing bug was resolved by correctly implementing the full settings-saving logic, from the frontend event handler in App.tsx down to the data-access layer in databaseService.ts.

    Session Summary: Full Airtable Deprecation and Image Upload Refactor

Session Summary (2025-09-02)[2]
The primary goal of this session was to resolve an image upload error and complete the final migration from Airtable to MongoDB by removing all remaining Airtable-related code from the
project.

Initial Problem:
The application was throwing a 404 Not Found error when attempting to upload images. This was caused by the frontend calling a deprecated API endpoint (/api/cloudinary/upload) that did
not align with the consolidated backend routing structure which uses action query parameters (e.g., /api/cloudinary?action=upload).

Solution and Refactoring:

1. Endpoint Correction: The initial 404 error was fixed by updating the bffService.ts to use the correct ?action= parameter for all Cloudinary, Cloudflare, and Facebook API calls.

2. Airtable Code Removal (API):
    * The legacy Airtable request handler was completely removed from api/index.js.
    * The unused utility file api/lib/airtable.js was deleted.

3. Airtable Code Removal (Frontend):
    * The databaseService.ts was refactored to remove all backward-compatibility aliases for Airtable functions (e.g., listBrandsFromAirtable). All data functions now have an explicit
        ...FromDatabase suffix.
    * App.tsx was significantly refactored to:
        * Update all data service calls to use the new, non-aliased function names (e.g., createOrUpdateBrandRecordInDatabase).
        * Remove the now-defunct DatabaseLoadModal component and its related state and event handlers, which were remnants of the Airtable loading workflow.

Outcome:
The image upload functionality is now stable and correctly integrated with the MongoDB backend. All legacy code related to the Airtable database has been scrubbed from the project,
completing the migration.

Session Summary (2025-09-02)[3]
* Completed Airtable Removal: I removed all remaining remnants of the Airtable integration, including the DatabaseLoadModal.tsx component, associated functions and state in App.tsx, and the airtable package itself.
* Fixed Image Pasting in Modals: I resolved an issue where pasting an image into the "Post Detail" modal was not working by adding the necessary event handlers.
* Addressed Image URL Saving: I identified and fixed a bug where imageUrls for "Logo Concepts" were not being saved to MongoDB. This involved:   
	* Updating the LogoConcept and UnifiedProfileAssets types in types.ts to include an imageUrl field.   
	* Modifying the create-or-update-brand action in the backend to initialize these new fields.   
	* Correcting the sync-asset-media backend action to properly update image URLs.
* State Management Refactoring: I lifted the viewingPost state from the MediaPlanDisplay component up to the main App component to ensure the "Post Detail" modal correctly displays updated data after an image is pasted.
* Resolved Build Errors: I fixed multiple build-time and runtime errors related to incorrect function imports and syntax issues that arose during the refactoring process.

Session Summary (2025-09-02)[4]
===

## Bug Fixes & Refactoring

This session focused on addressing several critical bugs and completing the refactoring of asset management to use a single, consolidated data structure in MongoDB.

### 1. Fixed Duplicate `logoConcepts` in Database Schema

**Problem:**
The `brands` collection in MongoDB contained two separate fields for logo concepts:
- A top-level `logoConcepts` array (old/deprecated structure).
- A nested `coreMediaAssets.logoConcepts` array (new/consolidated structure).
This caused data inconsistency and confusion.

**Solution:**
- Modified the backend `/api/mongodb.js`:
    - **`create-or-update-brand`**: Removed saving logo concepts to the deprecated top-level field. Now only saves to `coreMediaAssets.logoConcepts`.
    - **`initial-load` & `load-complete-project`**: Updated to load logo concepts exclusively from `brandRecord.coreMediaAssets.logoConcepts`.
    - **`sync-asset-media`**: Simplified to directly update the entire `coreMediaAssets` object sent by the frontend, as it's now the single source of truth.
- Ensured frontend services and components already used `assets.coreMediaAssets.logoConcepts`, so no UI changes were required for data consumption.

### 2. Fixed Loading Existing Logo Images in Brand Kit UI

**Problem:**
When loading an existing brand, logo images that had been previously generated or uploaded were not displayed in the Brand Kit tab. The UI showed the "Generate" or "Upload" placeholder instead of the persisted image.

**Root Cause:**
The `ImageGenerator` component used the `generatedImages` cache (a state in `App.tsx`) to display images, looking them up by `imageKey`. While the initial data load (`loadInitialProjectData`) correctly fetched the `imageUrl` from the database, it did not populate the `generatedImages` cache. This cache was only populated when an image was generated or uploaded during the current session.

**Solution:**
- Modified `handleLoadFromDatabase` in `App.tsx` to pre-populate the `generatedImages` state after loading initial data:
    - Iterates through `brandKitData.coreMediaAssets.logoConcepts` and adds entries to the cache: `{ [logo.imageKey]: logo.imageUrl }`.
    - Also populates cache for `unifiedProfileAssets` if `profilePictureImageUrl` or `coverPhotoImageUrl` exist.
- This ensures that `ImageGenerator` can immediately find and display persisted images upon loading a brand.

### 3. Fixed Post Detail Modal Opening Error

**Problem:**
Clicking on a post card to open the Post Detail modal resulted in a JavaScript error: `Uncaught TypeError: setViewingPost is not a function`.

**Root Cause:**
- `MainDisplay.tsx` expected `viewingPost` and `setViewingPost` as props and passed them down to `MediaPlanDisplay`.
- However, these props were missing from the `MainDisplayProps` interface definition and were not being passed from `App.tsx` when `MainDisplay` was instantiated.

**Solution:**
- Added `viewingPost: PostInfo | null;` and `setViewingPost: (postInfo: PostInfo | null) => void;` to the `MainDisplayProps` interface in `MainDisplay.tsx`.
- Added `viewingPost={viewingPost}` and `setViewingPost={setViewingPost}` to the props list when `MainDisplay` is rendered in `App.tsx`.

### 4. Fixed Post Feed Not Refreshing After Individual Post Changes

**Problem:**
After making changes to a post in the Post Detail modal (e.g., uploading an image) and closing the modal, the main Posts feed did not reflect the changes (e.g., the new image was not shown on the corresponding post card).

**Root Cause:**
- The `assetsReducer` in `App.tsx` uses the `planId`, `weekIndex`, and `postIndex` from a `postInfo` object to locate and update the specific post within the `generatedAssets` state.
- In `MediaPlanDisplay.tsx`, the list of posts rendered in the feed (`paginatedPostInfos`) was constructed with incorrect `weekIndex` and `postIndex` values (hardcoded or based on a flattened list).
- When `handleSetImage` was called from the modal, it passed this incorrect `postInfo`. The reducer used these wrong indices, failed to find the actual post in the nested `plan.plan[weekIndex].posts[postIndex]` structure, and thus never updated the main state. The `generatedImages` cache was updated, but the main data source for the feed was not.

**Solution:**
- Corrected the `paginatedPostInfos` `useMemo` in `MediaPlanDisplay.tsx`:
    - Implemented logic to iterate through the actual `selectedPlan.plan` structure.
    - Created a map to correctly associate each `post.id` with its true `weekIndex` and `postIndex`.
    - Ensured every `PostInfo` object in `paginatedPostInfos` now has the accurate coordinates needed for the reducer to update the correct post in the main state.
- This ensures that changes made in the modal are correctly propagated to the main state, triggering a re-render of the feed with the updated data.

### Session Summary (2025-09-03)

This session focused on significant bug fixing and the implementation of a major new feature, "Auto-Generate Persona Profile". We addressed issues ranging from data synchronization and database operations to UI layout and component-level logic.

### 1. New Feature: Auto-Generate Persona Profile

A new feature was fully implemented to auto-generate multiple, diverse brand personas based on the brand's mission and USP.

*   **Backend:**
    *   A new `auto-generate-persona` action was added to `api/gemini.js`.
    *   The AI prompt was specifically engineered to request an array of 3 diverse personas (including a mix of genders) and to return the data in a structured JSON format.
*   **Database & Types:**
    *   The `Persona` type in `types.ts` was extended with new optional fields: `contentTone`, `visualCharacteristics`, `coreCharacteristics`, `keyMessages`, and `gender`.
    *   The `save-persona` action in `api/mongodb.js` was updated to save these new fields and to robustly handle ID generation, ensuring the `id` and `_id` fields are unified for new documents.
*   **Frontend:**
    *   A new `autoGeneratePersonaProfile` function was added to the service layer to call the new endpoint.
    *   The `PersonasDisplay.tsx` component was updated with an "Auto-Generate" button.
    *   A new modal, `AutoPersonaResultModal.tsx`, was created to display the array of generated personas and allow the user to select which ones to save.
    *   The main `App.tsx` component was updated with new state and handlers (`handleAutoGeneratePersona`, `handleSaveSelectedPersonas`) to manage the entire workflow.

### 2. Bug Fixes & Refinements

*   **Data Synchronization & Stale State:**
    *   **Stale Persona List:** Fixed a bug where the persona list didn't update after a new persona was saved. The `savePersona` function was modified to return the final database ID to the client, and a new `UPDATE_PERSONA_ID` reducer action was implemented in `App.tsx` to synchronize the client-side state.
    *   **Stale Promoted Products:** Fixed a bug where promoted products weren't displayed in the post detail modal. The root cause was that `affiliateLinks` were lazy-loaded. The fix involved updating the `initial-load` backend action and the corresponding frontend services to load affiliate links as part of the initial project data.
*   **Database Operations (`upsert` Bug):**
    *   Identified and fixed a critical, recurring bug where `updateOne` operations with `{ upsert: true }` were creating new, incomplete documents if the filter did not find a match.
    *   This was corrected in `update-media-plan-post` and `save-settings` by removing the `upsert` flag, making these functions true "updates" and preventing data corruption.
*   **UI & Component Logic:**
    *   **Missing Promotion Label:** Fixed a bug where the "Promo" label wasn't showing on `PostCard`s. The component was refactored to derive the promotion status from the `postInfo` prop directly, rather than relying on a derived `promotedProductsCount` prop from the parent.
    *   **Missing Loading Indicators:** Refactored the main tab components (`PersonasDisplay`, `AffiliateVaultDisplay`, `StrategyDisplay`) to remove their internal loading state and correctly use the `isLoading` prop passed from `MainDisplay` to show a loading overlay when data is being fetched.
    *   **Missing `Checkbox` Component:** Resolved a startup crash by creating a new `Checkbox` component in `ui.tsx` and a `CheckIcon` in `icons.tsx`, as they were being imported but did not exist.
*   **API Request Error:**
    *   **Funnel Generation Crash:** Fixed a `400 Bad Request` error from the Google AI API. The `generate` action in `api/gemini.js` was incorrectly nesting the `tools` property inside `generation_config`. The code was corrected to place `tools` at the top level of the API request payload.

### 3. Notes for Future Development

*   **State Synchronization:** The session revealed a recurring pattern of client-side state becoming out of sync with the database after creation operations (e.g., persona IDs, post IDs). **Recommendation:** Ensure all "create" operations in the backend API return the final document ID, and the client-side logic *always* has a mechanism to receive this ID and update its state with this information.
*   **Cautious Use of `upsert`:** The creation of incomplete documents was caused by the misuse of `{ upsert: true }`. **Recommendation:** Use `upsert` with extreme caution. It is only safe when the `$set` operation contains a complete data model for the document. For most cases, a clearer and safer pattern is to explicitly separate "create" and "update" logic.
*   **Component Responsibility:** Note the issue where `PostCard` relied on a derived prop (`promotedProductsCount`) from its parent, which was a point of failure. Making child components more self-reliant by passing them the full data object (`postInfo`) and letting them derive their own state is more robust.
*   **Lazy Loading Complexity:** Mention that the lazy-loading strategy for core data (`affiliateLinks`) caused downstream bugs in components that depended on that data. Suggest that for a given "project" or "brand" context, it might be simpler and more robust to load all associated reference data (like personas, affiliate links) at the start, rather than on a per-tab basis. This simplifies state management and prevents downstream component failures.

## Session Summary (2025-09-04)

This session focused on fixing several bugs related to data synchronization, state management, and UI layout in the "Content Strategy" tab.

### 1. Bug Fixes and Refactoring

**Bug: "Tạo ý tưởng" (Generate Ideas) button in Affiliate Vault was unresponsive.**
- **Analysis:** The `onGenerateIdeasFromProduct` prop was not being passed down from `App.tsx` to the `AffiliateVaultDisplay` component through `MainDisplay.tsx`.
- **Fix:** The prop was added to the `MainDisplayProps` interface, and the handler was correctly passed down through the component tree, restoring the button's functionality.

**Bug: BSONError when saving a new trend generated from a product.**
- **Analysis:** The backend's `save-trend` action was attempting to convert a custom string ID (e.g., `product-xxxx`) into a MongoDB `ObjectId`, which caused a crash.
- **Fix:** The `save-trend` action in `api/mongodb.js` was updated to first validate if the incoming `trend.id` is a valid `ObjectId`. If not, it now correctly creates a new trend with a new database-generated `ObjectId`.

**Bug: New ideas generated from a trend or product were not displayed on the UI without a page reload.**
- **Analysis:** This was a multi-faceted issue:
    1.  A race condition existed where the UI would attempt to re-render before the new ideas were successfully saved to the database.
    2.  The `trendId` assigned to new ideas generated from a product was incorrect (using a `product-` prefix), causing a mismatch with the actual trend ID in the database.
    3.  A stale cache issue was identified where `lazyLoadService.ts` and `databaseService.ts` maintained separate, unsynchronized caches.
- **Fix:**
    1.  The `handleGenerateIdeas` and `handleGenerateIdeasFromProduct` functions in `App.tsx` were refactored to ensure the local state is only updated *after* the new data has been successfully saved to the database and the new database IDs have been returned.
    2.  The logic for creating product-based trends was rewritten to remove the `product-` prefix and to use the correct database ID for the `trendId` field in the idea objects.
    3.  The cache logic was consolidated by removing the local cache in `lazyLoadService.ts` and making it import and use the single cache instance from `databaseService.ts`.

**Bug: Duplicated API calls on home page load.**
- **Analysis:** The duplicated calls were identified as a side effect of React's `StrictMode` in development mode, which intentionally calls `useEffect` hooks twice to detect issues.
- **Fix:** To prevent redundant API calls during development, a `useRef` was implemented in the `useEffect` hooks in both `App.tsx` and `IdeaProfiler.tsx` to ensure that the initial data fetching logic runs only once per component mount.

### 2. Notes for Future Development

- **State Synchronization with Database:** A recurring theme was the client-side state becoming out of sync with the database, especially after creating new documents. **Recommendation:** Always ensure that any "create" operation in the backend API returns the final document (including its database-generated ID), and the client-side logic is designed to receive this new ID and update its state accordingly. This prevents issues with stale data and incorrect IDs.

- **Cache Management:** The presence of two separate data caches led to stale data being served to the UI. **Recommendation:** Maintain a single source of truth for any application-wide cache. Caching logic should be consolidated into a single, dedicated service to avoid synchronization problems.

- **Asynchronous Operations and UI Updates:** Be mindful of race conditions when dealing with asynchronous operations that update the UI. Avoid updating the UI with temporary client-side data before the corresponding backend operation has completed. Whenever possible, wait for the successful completion of the async task and use the data returned from the server to update the state.

- **Clarity on ID Fields:** The project uses both `id` (database `_id`) and `productId` (from affiliate platforms). **Recommendation:** Ensure that the correct ID is used in the correct context to avoid data mismatches. When in doubt, add logging to inspect the objects being passed between functions.

### Session Summary (2025-09-04) [2]

The primary goal of this session was to diagnose and fix a critical performance issue causing extremely long initial application load times (45s+ LCP). The root causes were identified as sequential API calls on startup and an excessively large initial JavaScript bundle.

### 1. Key Accomplishments & Technical Changes

*   **API Call Consolidation:**
    *   The initial separate, sequential API calls for `check-credentials`, `list-brands`, and `fetch-admin-defaults` were identified as a major bottleneck.
    *   A single, consolidated backend action `app-init` was created in `/api/mongodb.js` to perform the work of all three initial calls in one parallel, server-side operation.
    *   The corresponding frontend code in `App.tsx` and `databaseService.ts` was refactored to use a single `initializeApp` function, reducing network round-trips from 3-4 to just one.

*   **Code-Splitting and Lazy Loading:**
    *   The application's entire codebase was being downloaded in a single, multi-megabyte JavaScript file (`App.tsx`), which severely delayed rendering.
    *   Implemented aggressive code-splitting using `React.lazy()` and `<Suspense>`.
    *   All major views (`IdeaProfiler`, `BrandProfiler`, `MainDisplay`, `AdminPage`) and all modal dialogs (`SettingsModal`, `ScheduleModal`, etc.) across the application are now loaded dynamically on demand, rather than all at once. This dramatically reduces the initial bundle size.

*   **Dependency & State Refactoring:**
    *   Fixed multiple `Uncaught SyntaxError` crashes that occurred after the initial refactoring. These were caused by child components (`configService.ts`, `IdeaProfiler.tsx`) trying to import and call functions that had been deleted from `databaseService.ts`.
    *   Refactored `IdeaProfiler.tsx` to remove its own data-fetching logic. It now receives the list of brands as a prop from the main `App.tsx` component, which is a more efficient and standard React pattern.
    *   Refactored `configService.ts` to be a simple state container that gets initialized by `App.tsx`, removing its own API-calling capabilities.

### 2. Notes for Future Development

*   **Thoroughness of Refactoring:** When consolidating an API or function, it is critical to perform a global search to find and update **all** call sites. Simply creating the new function is not enough; the old functions and their corresponding calls must be fully removed to prevent errors and redundant network requests.
*   **Data Flow:** The session highlighted the importance of a clear, top-down data flow. The final, correct pattern involved the top-level `App.tsx` component fetching all necessary initial data once, and then passing that data down to child components via props. This should be the preferred pattern over having individual child components fetch their own data.
*   **Assume Nothing About Imports:** The errors I introduced were from making assumptions about which modules were importing the functions I deleted. A future best practice will be to actively search for usages of a function across the codebase *before* deleting it.
*   **Browser Cache:** While the issues in this session were code-related, the initial symptoms (old API calls still appearing) were characteristic of a browser cache issue. It's important to remember to instruct users to perform a hard refresh (Ctrl+Shift+R) after significant frontend changes are deployed.

### Session Summary (2025-09-04) [3]

This session focused on integrating a new image generation service and fixing several related bugs in the API and frontend services.

### 1. New Feature: "Google Banana" Image Generation

A new image generation service using Google's `gemini-1.5-flash-image-preview` model was successfully integrated.

*   **Backend (`api/gemini.js`):** Instead of creating a new file, a new action `generate-banana-image` was added to the existing `api/gemini.js`. This action uses the `generateContent` method from the `@google/genai` SDK and extracts the image data from the `inlineData` part of the response.
*   **Services (`bffService.ts`, `geminiService.ts`):** Corresponding functions (`generateImageWithBananaBff`, `generateImageWithBanana`) were added to the frontend services to facilitate calling the new backend action.
*   **Configuration (`SettingsModal.tsx` & Database):** It was discovered that the list of available AI models is dynamically populated from the `aiServices` collection in MongoDB. The integration was completed by adding a routing case in `App.tsx` for models prefixed with `banana/`, requiring the user to add the new model to their database to make it selectable in the UI.

### 2. Bug Fixes

*   **Gemini `generate-image` Crash:**
    *   **Problem:** A `TypeError: geminiModel.generateImages is not a function` was crashing the generic Gemini image generation endpoint.
    *   **Fix:** The `generate-image` action in `api/gemini.js` was refactored to use the correct `generateContent` method, aligning it with the modern SDK usage and the new "Banana" implementation. The incorrect frontend routing for `imagen-` models in `App.tsx` was also removed to prevent future errors.

*   **Cloudflare Image Generation 404 Error:**
    *   **Problem:** Calls to the Cloudflare image generator were failing with a `404 Not Found` error.
    *   **Analysis:** The frontend was calling an incorrect URL (`/api/cloudflare/generate-image`) that did not match the project's standardized API route structure (`/api/cloudflare?action=generate-image`).
    *   **Fix:** The URL was corrected in the `generateImageWithCloudflareBff` function within `src/services/bffService.ts`.

### 3. Notes for Future Development

*   **My Misunderstanding of Existing Libraries:** My initial plan was overly complex, involving new files and dependencies. The user correctly pointed out that the feature could be implemented with the existing `@google/genai` library. **Recommendation:** Before adding new dependencies or files, always thoroughly investigate if the desired functionality can be achieved with the tools already present in the project.

*   **API Route Consistency:** The Cloudflare 404 error was a regression bug caused by a single endpoint being missed during a previous, large-scale API refactoring. **Recommendation:** When performing project-wide refactoring, use global search and other tools to ensure *all* call sites are identified and updated. Inconsistency in API patterns is a common source of bugs.

*   **Frontend/Backend Contract:** Both bugs fixed in this session were caused by a mismatch between the frontend's request and the backend's expectation (either an incorrect URL or an incorrect SDK method call). **Recommendation:** When debugging, always verify the entire request-response chain, from the initial frontend call to the specific backend handler logic, to ensure they match perfectly.

Session Summary (2025-09-05)[1]
---

### 1. Summary of Accomplishments

This session focused on a significant enhancement to the application's settings management system, implementing a "Dynamic Opt-in Settings" feature.

*   **Implemented "Dynamic Opt-in Settings":** The application now supports a more advanced settings flow where client brands can selectively "opt-in" to updated global admin default values.
*   **New `SettingField` Component:** A reusable React component (`SettingField.tsx`) was created to encapsulate the logic for displaying individual settings, comparing brand-specific values against admin defaults, and providing an "opt-in" mechanism via dynamic dropdowns.
*   **Refactored `App.tsx`:** The main application component was updated to manage the global `adminSettings` state and correctly pass it down to the `SettingsModal`. It also includes a unified `handleSaveSettings` function to save either brand-specific or admin default settings.
*   **Refactored `SettingsModal.tsx`:** The settings modal UI was overhauled to utilize the new `SettingField` component for all configurable settings, replacing static input elements. It now receives and processes both brand-specific and admin default settings.
*   **Removed Obsolete Settings Sections:** The "Text Model Fallback Order" and "Vision Models" sections were removed from the `SettingsModal` UI as per user request.

### 2. Key Technical Changes

*   **`src/components/SettingField.tsx` (New File):**
    *   Created to render individual setting fields.
    *   Props: `id`, `label`, `description`, `brandValue`, `adminValue`, `onChange`, `type`, `options`.
    *   Displays "Customized" badge if `brandValue !== adminValue`.
    *   For `type="select"`, dynamically generates options including `brandValue` and `adminValue` (labeled as "Default").
*   **`src/App.tsx` Modifications:**
    *   **State:** Added `const [adminSettings, setAdminSettings] = useState<Settings | null>(null);`.
    *   **Initialization:** Modified `useEffect` (where `initializeApp` is called) to set `adminSettings` using `configService.getAdminDefaults()`.
    *   **`handleSaveSettings`:** Implemented a unified `useCallback` function to handle saving. It checks `mongoBrandId` to determine whether to call `saveSettings` (for brand) or `saveAdminDefaultsToDatabase` (for admin).
    *   **`SettingsModal` Invocation:** Updated the `<SettingsModal />` component to pass `adminSettings={adminSettings}` and `onSave={handleSaveSettings}`.
*   **`src/components/SettingsModal.tsx` Modifications:**
    *   **Props:** Updated `SettingsModalProps` interface to include `adminSettings: Settings | null;`.
    *   **Destructuring:** Corrected the component's function signature to destructure `adminSettings` from props.
    *   **Imports:** Added `import SettingField from './SettingField';`.
    *   **UI Refactor:** Replaced direct `Input`, `TextArea`, `Select` elements with `<SettingField />` components for `language`, `textGenerationModel`, `imageGenerationModel`, `totalPostsPerMonth`, `mediaPromptSuffix`, and `affiliateContentKit`.
    *   **Removal:** Deleted the `div` blocks corresponding to "Text Model Fallback Order" and "Vision Models" sections.

### 3. Bug Fixes During Session

*   **`Identifier 'handleSaveSettings' has already been declared` (in `App.tsx`):**
    *   **Cause:** A duplicate `handleSaveSettings` function was introduced during the initial `App.tsx` modification.
    *   **Fix:** The redundant `handleSaveSettings` declaration at line ~808 in `App.tsx` was removed.
*   **`Uncaught ReferenceError: adminSettings is not defined` (in `SettingsModal.tsx`):**
    *   **Cause:** The `adminSettings` prop was passed to `SettingsModal` but was not correctly destructured in the component's function signature.
    *   **Fix:** `adminSettings` was added to the destructuring list in the `SettingsModal` component's function signature.
*   **`imageGenerationModel` (Custom) label bug:**
    *   **Cause:** The original `SettingsModal.tsx` had a bug where the custom option label for `imageGenerationModel` incorrectly referenced `settings.textGenerationModel`.
    *   **Fix:** This was implicitly corrected when replacing the old `Select` component with `SettingField`, as `SettingField` dynamically generates its options and labels correctly.

### 4. Notes for Future Development / Lessons Learned

*   **Precision in `replace` Operations:** The session highlighted the critical importance of absolute precision when using `replace` for code modification, especially in large files. Even minor whitespace differences or subtle bugs in the `old_string` can cause failures.
    *   **Recommendation:** When `replace` fails, re-read the target file with `read_file` to get the *exact* current content. Consider replacing smaller, more isolated blocks if large replacements are problematic.
*   **Contextual Awareness of Codebase:** Before introducing new functions or modifying existing logic, perform a quick `search_file_content` to check for existing implementations. The duplicate `handleSaveSettings` function was a direct result of lacking this initial contextual check.
*   **Incremental Verification:** After significant changes, especially to core components like `App.tsx` or shared modals, it's beneficial to run tests or check the application's behavior incrementally rather than waiting for a large set of changes to be complete.
*   **Robust Error Handling in Components:** The `SettingField` component's design to gracefully handle `adminValue` being `null` or `undefined` (e.g., `adminSettings?.language`) is a good practice for dealing with potentially incomplete data.
*   **Refactoring Debt:** The original `SettingsModal.tsx` had some hardcoded logic and a bug (e.g., `textGenerationModel` reference). Refactoring often exposes such technical debt, and it's good practice to address it as part of the change.

## Session Summary (2025-09-05) [2]

This session focused on a deep refactoring and debugging of the application's hierarchical settings system, moving from a conceptual design to a fully implemented and corrected feature. The primary goal was to ensure that brand-specific settings correctly override global defaults and that all features dynamically use these settings.

---

### 1. Key Accomplishments & Technical Changes

**A. Database Schema Refactoring (AI Models):**
-   **Merged Collections:** To improve maintainability, the `aiServices` and `aiModels` collections were merged into a single, unified `aiModels` collection in MongoDB. The user later renamed this to `aiModels` (camelCase) and the code was updated to match.
-   **Migration Script:** A script (`scripts/migrate-ai-models.js`) was created to handle the data transition. It was subsequently debugged to use ES Module `import` syntax instead of `require`.
-   **Backend Refactoring:** All backend actions in `api/mongodb.js` (`load-settings-data`, `save-ai-model`, `delete-ai-model`) were refactored to work with the new unified `aiModels` collection. Obsolete actions for managing services were removed.

**B. Frontend Refactoring (Admin & Services):**
-   **`databaseService.ts`:** This service was updated to remove all functions related to the obsolete `aiServices` collection.
-   **`AdminPage.tsx`:** This component was significantly refactored. The UI for managing services was removed, and the component was simplified to provide a single interface for managing the unified list of AI models.

**C. Core Feature Implementation & Bug Fixes:**

1.  **Brand Settings Initialization:**
    -   **Requirement:** New brands should receive a *copy* of the global admin settings upon creation.
    -   **Fix:** The `create-or-update-brand` action in `api/mongodb.js` was modified. When a new brand is created, the backend now fetches the `adminSettings` document and saves it as the initial settings for the new brand, ensuring the correct behavior.

2.  **Incorrect Settings Loading Bug:**
    -   **Problem:** The `SettingsModal` was incorrectly displaying global settings instead of the loaded brand's specific settings.
    -   **Root Cause:** A `useEffect` hook in `App.tsx` that watched `mongoBrandId` was re-fetching default settings from a `configService` and overwriting the brand-specific settings that had just been loaded.
    -   **Fix:** The problematic `useEffect` was removed. The `handleLoadFromDatabase` function was updated to explicitly call `setSettings()` with the brand's specific data. The `handleSaveSettings` function was also refactored to remove its dependency on `configService` and update the state directly.

3.  **Hardcoded Settings Bug:**
    -   **Problem:** Several features were using hardcoded model names instead of the dynamic values from the `settings` object.
    -   **Root Cause:** An incomplete initial analysis that did not check all possible code paths.
    -   **Fixes:**
        -   The `generate-banana-image` and `auto-generate-persona` actions in `api/gemini.js` were modified to accept a `model` name from the request body.
        -   The full call stack for these features (`App.tsx` -> `geminiService.ts` -> `bffService.ts`) was updated to pass the dynamic `textGenerationModel` or `imageGenerationModel` to the backend.

4.  **`totalPostsPerMonth` Setting Bug:**
    -   **Problem:** The Media Plan Wizard was not using the `totalPostsPerMonth` setting.
    -   **Fix:** The `handleGenerateMediaPlanGroup` function in `App.tsx` was refactored to ignore parameters from the wizard and use `settings.totalPostsPerMonth` directly from the state. The redundant UI and state were removed from `MediaPlanWizardModal.tsx`.

**D. Documentation:**
-   A comprehensive feature description document, `Settings_Management_Feature.md`, was created to document the final, correct behavior of the entire settings system.

---

### 2. Notes for Future Development & Lessons Learned

-   **Analysis Thoroughness is Critical:** The hardcoded model bug highlighted a flaw in my analysis process. It is not enough to verify where a setting *is used*; one must also audit features that *should* use a setting to confirm they are not hardcoded. Future analysis must be more rigorous.
-   **Beware Indirect State Management:** The bug where brand settings were being overwritten was caused by a complex and indirect data flow (`useEffect` -> `configService` -> `setSettings`). This created a race condition that was difficult to debug. **Recommendation:** State updates should be as direct and explicit as possible. The final fix, which involved calling `setSettings` directly in the data loading callback (`handleLoadFromDatabase`), is a much more robust pattern.
-   **Backend-Driven Business Logic:** The final, correct implementation for initializing a new brand's settings was performed on the backend. This is the correct approach. The client should not be responsible for knowing system defaults; it should simply request an action, and the server should correctly implement the business logic.
-   **My Own Errors:** This session revealed several errors in my own process, including the accidental deletion of the `T` constant in `SettingsModal.tsx` and the incomplete fix for the hardcoded models. This serves as a reminder to be more systematic and to double-check the scope of all `replace` operations before executing them.

### Session Summary (2025-09-05) [3]

This session focused on implementing the "Believable Persona" feature, which involved a significant refactoring of the persona data model and the content generation workflow.

---

### 1. Key Accomplishments

*   **Phase 1: Persona Core Enhancement**
    *   **Evolved Data Model:** The `Persona` interface in `types.ts` was successfully expanded to include a rich, nested structure for the "Persona Bible," accommodating detailed fields like `demographics`, `backstory`, `voice`, `knowledgeBase`, and `brandRelationship`.
    *   **Upgraded Backend:**
        *   The `save-persona` action in `api/mongodb.js` was updated to correctly persist the new, rich `Persona` object structure to the database.
        *   The `auto-generate-persona` action in `api/gemini.js` was enhanced to generate these new detailed fields.
    *   **Refactored UI:**
        *   The old inline persona editor was removed from `PersonasDisplay.tsx`.
        *   A new, dedicated `PersonaEditorModal.tsx` was created with a tabbed interface to provide a comprehensive editor for all "Persona Bible" fields.
        *   A new `TagInput.tsx` component was created to support the new editing capabilities.
        *   The main `PersonasDisplay.tsx` component was simplified to show read-only summary cards and launch the new modal for all edits.

*   **Phase 2: Guided Prompt Builder Implementation**
    *   **Created In-Character Generation Endpoint:** A new `generate-in-character-post` action was added to `api/gemini.js`. This endpoint uses a new helper function, `constructBelievablePersonaPrompt`, to dynamically build advanced, layered prompts using the full persona object.
    *   **Updated Frontend Service:** The `geminiService.ts` was updated with a `generateInCharacterPost` function to call the new backend endpoint.
    *   **Upgraded Content Generation UI:** The "Refine with AI" functionality in `PostDetailModal.tsx` was replaced with a "Guided Prompt Builder" UI, allowing users to generate content by providing a simple "Objective" that is then executed using the full context of the assigned persona.

*   **Bug Fix: Incomplete Auto-Generated Personas**
    *   **Identified Root Cause:** A critical bug was identified where auto-generated personas were saved with many empty fields. The root cause was a data-flow issue on the frontend: the `AutoPersonaResultModal.tsx` and the `handleSaveSelectedPersonas` function in `App.tsx` were not structured to handle the new rich persona object, causing the detailed fields to be discarded before saving.
    *   **Resolution:** The bug was fixed by refactoring both `AutoPersonaResultModal.tsx` and the `handleSaveSelectedPersonas` function in `App.tsx` to ensure the complete, rich persona data structure is preserved throughout the entire workflow, from AI generation to database persistence.

---

### 2. Notes for Future Development & Lessons Learned

*   **Holistic Data Flow Analysis:** The most critical lesson from this session was that when a data model is changed, the *entire data flow* must be audited. The bug was not just in the backend (prompt) issue but a full data-flow problem across the stack (backend -> frontend state -> modal -> save handler). In the future, I must trace data from its origin (API) to its final destination (database), inspecting every component, state, and function along the way.
*   **Component Prop Contracts:** The bug was caused by a component (`AutoPersonaResultModal`) and a handler (`handleSaveSelectedPersonas`) not being updated to match the new, richer `Persona` data type they were receiving. This highlights the importance of treating component props as a strict contract that must be updated whenever the underlying data model changes.
*   **Tooling Sensitivity (`replace` vs. `write_file`):** The `replace` tool proved unreliable for large, complex files due to its sensitivity to subtle formatting like line endings. The `write_file` command (which overwrites the entire file) is a more robust and definitive method for applying large-scale refactoring to a single file, avoiding issues with matching `old_string`.
*   **Defensive AI Consumption:** While the primary bug was in the frontend code, it was compounded by the AI's initial failure to perfectly adhere to the requested JSON schema. The final fix included making the backend prompt stricter, but the key takeaway is to always validate and handle data from an AI defensively, as its output can be unpredictable.

# Session Summary (2025-09-05) [4]

---

### 1. Summary of Accomplishments

This session focused on completing the implementation of the "Guided Prompt Builder," fixing several critical bugs related to API error handling and service layer implementation, and improving user experience based on feedback.

*   **Completed Phase 2: Guided Prompt Builder**
    *   **Backend (`api/gemini.js`):** The `generate-in-character-post` action was enhanced to accept and utilize `keywords` for more specific content generation.
    *   **Services (`bffService.ts`, `geminiService.ts`):** The `keywords` parameter was propagated through the entire service layer.
    *   **UI (`PostDetailModal.tsx`):** The "Rewrite with Persona" feature was upgraded to a full "Guided Prompt Builder" with distinct inputs for `Objective`, `Platform`, and `Keywords`.
    *   **UI (`MediaPlanWizardModal.tsx`):** The first step of the wizard was refactored to use the new Guided Prompt Builder, replacing the old freeform prompt.
    *   **State & Props (`App.tsx`, `MainDisplay.tsx`, `MediaPlanDisplay.tsx`):** A new handler (`handleGenerateInCharacterPost`) was created and correctly passed down through the component tree to power the new UI.

*   **Bug Fix: `TypeError: textGenerationService.generateInCharacterPost is not a function`**
    *   **Root Cause:** The `textGenerationService.ts` file defined the function in its TypeScript interface but was missing the implementation in the `googleService` and `openRouterService` objects.
    *   **Fix:** The service was updated to correctly import and delegate the `generateInCharacterPost` call to the appropriate underlying service (`geminiService`), resolving the runtime error.

*   **Bug Fix: Model Fallback Failure on 503 Errors**
    *   **Root Cause:** The frontend `withFallback` helper was not correctly interpreting the wrapped error message coming from the BFF when the Gemini API returned a 503 "Service Unavailable" error. The backend was not resilient and crashed, preventing the frontend from attempting a fallback to a different model.
    *   **Fix:** The `withFallback` function in `textGenerationService.ts` was made more robust. Its error checking is now more lenient, allowing it to correctly identify 503-related errors within the BFF's response and trigger the model fallback logic as intended by the `textModelFallbackOrder` setting.

*   **UX Improvement: Clarified Persona Generation Workflow**
    *   **Feedback:** The user correctly pointed out that it was unclear why a "Rewrite with Persona" button was needed if plans were already generated in-character.
    *   **Fix:** An informational note was added to the persona selection step in the `MediaPlanWizardModal.tsx` to clarify that initial generation is already in-character and the button is for later, granular refinements.

### 2. Notes for Future Development & Lessons Learned

*   **My Misunderstanding of Fallback vs. Retry:** My initial approach to the 503 error was to add a *retry* loop to the backend. The user correctly guided me to use the existing *fallback* mechanism on the frontend. The backend should fail clearly to allow the more intelligent frontend logic to handle it. This is a key architectural principle of the application I must adhere to.

*   **Trace Props, Don't Assume:** I made an incorrect assumption that an existing prop (`onRefinePost`) was being used for a new feature. This led to wasted effort. I must always trace the prop chain from `App.tsx` downwards to ensure I am modifying the correct handlers.

*   **Thorough Service Layer Implementation:** The `TypeError` was a direct result of an incomplete implementation of a service interface. When adding a function to an interface, I must ensure it is implemented in all concrete service objects (`googleService`, `openRouterService`, etc.).

*   **Robust Error Inspection:** The fallback logic failed because the `catch` block was too strict in its inspection of the error message. When dealing with errors that are wrapped by other services (like our BFF), error inspection logic must be more robust and check the full string representation of the error, not just the `.message` property.

### Session Summary (2025-09-06) [1]

This session focused on implementing the "Content Strategy & Workflow" features, enhancing the AI's content generation capabilities through advanced prompt engineering, and fixing several bugs that arose during testing.

---

### 1. Key Accomplishments

*   **Implemented Phase 3: Content Strategy & Workflow:**
    *   **Content Pillars:** A full system for defining, managing, and utilizing content pillars was integrated. This included adding a pillar management UI to the `SettingsModal`, updating the database schema, and making the "Pillar" a mandatory selection in the `MediaPlanWizardModal` and `PostDetailModal`. The selected pillar is now passed through the entire service layer and incorporated into the backend generation prompt.
    *   **Workflow Statuses:** The `PostStatus` system was enhanced to include `'needs_review'` and `'approved'`. The UI was updated across `PostCard`, `CalendarView`, and `PostDetailModal` to display and manage these new statuses, allowing for a more granular content approval workflow.

*   **Advanced Prompt Engineering:**
    *   **Initial Refactor:** The core `generateMediaPlanGroup` prompt was significantly improved to better leverage the rich persona data, focusing on first-person embodiment and more creative outputs.
    *   **"Realistic Photos" Guide:** A guide on creating realistic AI photos was fetched from an external URL and saved as a new markdown document in the project (`feature_descriptions/how-to-make-realistic-ai-photos.md`).
    *   **Hyper-Detailed Image Prompts:** Based on the new guide, the `generateMediaPlanGroup` prompt was refactored a second time. It now contains a "Hyper-Detailed" section that strictly requires every generated `mediaPrompt` to include 8 key elements for realism (e.g., Atmosphere, Lighting, Camera Settings, Composition, Negative Prompts, etc.), complete with examples for the AI to follow.

*   **Bug Fixes & UX Improvements:**
    *   **Pillar Saving Bug:** Resolved an issue where not all content pillars were being saved correctly. The `handlePillarChange` function in `SettingsModal.tsx` was refactored to use a functional `setState` update, preventing stale state.
    *   **Wizard Crash:** Fixed a critical `ReferenceError: setTags is not defined` in the `MediaPlanWizardModal` by correcting a prop name typo.
    *   **Wizard UX Flow:** Corrected the media plan wizard's flow so that it always starts at Step 1 (allowing for pillar selection), even when initiated from a content idea.
    *   **AI JSON Response Failure:** Fixed a critical bug where the AI would return markdown instead of JSON. The root cause was an incorrect `JSON.stringify()` call on the prompt text in `api/gemini.js`, which has been corrected.

---

### 2. Notes for Future Development & Lessons Learned

*   **My Misunderstanding of the `replace` Tool:** The tool is extremely sensitive to whitespace and invisible characters. Multiple attempts to replace large blocks of code failed. **Future Strategy:** I must be more surgical, isolating the smallest unique string possible for replacement rather than entire functions, and re-reading the file immediately before a complex replacement.
*   **Stale State in React:** The pillar-saving bug was a classic React stale state issue. I must be more vigilant in using the functional update form of `useState`'s setter (`setState(prev => ...)`), especially when the new state depends on the previous state.
*   **AI Prompt Formatting:** The JSON parsing error was a critical bug caused by incorrectly formatting the request to the Gemini API. I must remember to ensure that the data being sent matches the exact format expected by the external service's SDK. `JSON.stringify` should be used on the *body object*, not on the *content string* within it.
*   **Thoroughness in Refactoring:** The wizard crash was a simple typo that I missed during a larger refactoring. This highlights the need to double-check all props and function calls related to any component I modify.

## Session Summary (2025-09-06) [2]

### 1. Summary of Accomplishments

This session focused on implementing a **Prompt Configuration Modal** to externalize hardcoded AI prompts, significantly enhancing the application's configurability.

*   **Data Model Extension:**
    *   The `types.ts` file was updated with a comprehensive `Prompts` interface, including nested structures for `AutoGeneratePersonaPrompts`, `GenerateInCharacterPostPrompts`, `MediaPlanGenerationPrompts`, `SimplePrompts` (for various single-string prompts), and `ContentPackagePrompts`. This new `prompts` object was added to the main `Settings` interface.
*   **Backend Database Refactoring (`api/mongodb.js`):**
    *   A new file, `api/lib/defaultPrompts.js`, was created to centralize all default prompt values.
    *   The `save-admin-defaults` action was modified to perform a deep merge of incoming settings with `defaultPrompts`, ensuring a complete `prompts` object is always saved to the `adminSettings` collection.
    *   The `create-or-update-brand` action was updated to ensure new brands inherit a complete `prompts` object from `adminSettings` (which are themselves merged with `defaultPrompts`).
    *   The `app-init` and `load-settings-data` actions were updated to correctly return the `prompts` field within the `adminSettings` object, including a fallback for initial empty settings.
*   **Backend AI Service Refactoring (`api/gemini.js`):**
    *   The `auto-generate-persona` action was refactored to dynamically construct its prompt using templates from `settings.prompts.autoGeneratePersona`.
    *   The hardcoded `constructBelievablePersonaPrompt` helper function was removed.
    *   The `generate-in-character-post` action was refactored to dynamically build its prompt using templates from `settings.prompts.generateInCharacterPost` and persona data.
*   **Frontend AI Service Refactoring (`src/services/geminiService.ts`):**
    *   The `generateMediaPlanGroup` function was refactored to use configurable prompts from `settings.prompts.mediaPlanGeneration`.
    *   All other prompt-based functions (`refinePostContentWithGemini`, `generateBrandProfile`, `generateBrandKit`, `generateMediaPromptForPost`, `generateAffiliateComment`, `generateViralIdeas`, `generateContentPackage`, `generateFacebookTrends`, `generatePostsForFacebookTrend`, `generateIdeasFromProduct`) were refactored to use their respective configurable prompts from `settings.prompts.simple` and `settings.prompts.contentPackage`.
    *   Function signatures across these services were updated to accept the `settings: Settings` object.
*   **Frontend Service Layer (`src/services/textGenerationService.ts`):**
    *   The `TextGenerationService` interface was updated to reflect the new function signatures (passing `settings: Settings`).
    *   The `googleService` and `openRouterService` implementations were updated to correctly pass the `settings` object to their underlying `geminiService` or `openrouterService` functions.
*   **Frontend UI Component (`src/components/PromptManager.tsx`):**
    *   A new React component, `PromptManager.tsx`, was created. It provides a UI for editing prompt configurations, allowing comparison with global admin defaults.
*   **Frontend UI Integration (`src/components/AdminPage.tsx`):**
    *   The `AdminPage.tsx` was refactored to include a new tabbed interface, with a dedicated "Prompt Management" tab that renders the `PromptManager` component for global prompt configuration.
*   **Frontend UI Integration (`src/components/SettingsModal.tsx`):**
    *   The `SettingsModal.tsx` was updated to include a new "Prompts" tab, rendering the `PromptManager` component for brand-specific prompt overrides.

### 2. Notes for Future Development

*   **`replace` tool precision:** The session highlighted the extreme sensitivity of the `replace` tool to exact string matching, including whitespace and line endings. Future complex replacements should involve `read_file` immediately before execution to ensure the `old_string` is precise.
*   **Missing Frontend `settings` propagation (CRITICAL):** The `settings` object is now expected by many backend and service-layer functions. However, the calls to these functions from `App.tsx` and `bffService.ts` have *not yet* been updated to pass this `settings` object. This will cause runtime errors and must be addressed immediately in the next session.
*   **OpenRouter limitations:** Note that OpenRouter models currently do not support content package generation, Facebook trend generation, or in-character post generation, leading to explicit errors in the code. This is a known limitation of the OpenRouter integration.

## Session Summary (2025-09-07) [1]

This session was primarily focused on a series of critical bug fixes, followed by a significant refactoring of the application's settings initialization logic.

### 1. Key Accomplishments

*   **Critical Bug Fixes:** Resolved multiple application-breaking bugs:
    *   Fixed several server-side startup crashes (rs is not defined, corrupted defaultPrompts.js) caused by faulty file modifications.
    *   Eliminated a data-loss bug in the settings logic by replacing a shallow object merge with a proper deepMerge implementation in api/mongodb.js.
    *   Fixed multiple UI crashes on the Admin Page, including a TypeError related to model.capabilities (by adding an Array.isArray check) and a TypeError in the PromptManager (by adding a null check).
    *   Corrected several syntax errors introduced during previous refactoring attempts.

*   **Settings Logic Refactoring:** The logic for handling default settings was completely overhauled to be more robust and maintainable.
    *   **Auto-Initializing Defaults:** The app-init API action in api/mongodb.js was rewritten. It now detects if the adminSettings in the database are missing prompts and, if so, automatically saves the complete default configuration to the database on the first run.
    *   **Source of Truth:** The create-or-update-brand action was corrected to use the adminSettings from the database as the single source of truth when creating a new brand, rather than re-merging with hardcoded files.
    *   **Code Organization:** The hardcoded default settings object was extracted from api/mongodb.js into a new, dedicated file at api/lib/defaultSettings.js for better maintainability.

### 2. Issues to Note & Lessons Learned

*   **My Misuse of the `replace` Tool:** The most significant source of errors and repeated work during this session was my misuse of the `replace` tool. It proved to be too brittle for large, multi-line code blocks, often failing to match strings with subtle whitespace/newline differences. This led directly to me introducing syntax errors and corrupted files, which caused several of the crashes we had to debug.

*   **Incomplete Bug Fix:** The crash within the generateContentPackage function (caused by unsafe access to persona properties) was correctly identified, but the fix was not successfully applied. **This remains an outstanding bug that needs to be addressed in the next session.**

### 3. Preventative Measures for Future Sessions

To prevent a recurrence of these issues, I will adhere to the following procedures:
1.  **Abandon `replace` for Complex Changes:** For any non-trivial code modification, I will now exclusively use a read-modify-write strategy: read the entire file, perform the replacement in memory, and then use `write_file` to overwrite the original. This is more robust and avoids the string-matching failures.
2.  **Mandatory Verification Step:** After every single file modification (write_file or replace), I will immediately run the project's build command (npm run build) to verify the syntactic and type correctness of my changes *before* reporting back or moving to the next step. This was a key process improvement suggested by you that I will now follow strictly.

# Session Summary (2025-09-07) [2]

## Summary of Accomplishments

This session focused on fixing critical authentication and data persistence issues in the SocialSync Pro application. Two major problems were identified and addressed:

### 1. Admin Authentication Persistence
**Problem:** Admin users had to re-login every time they refreshed the page because authentication state was only stored in React component state, which is lost on page reload.

**Solution:** Implemented persistent admin authentication using localStorage with a 3-day expiration:
- Created a new `adminAuthService.ts` service with functions for authentication, logout, and token validation
- Modified `App.tsx` to check for valid authentication tokens on app initialization
- Updated the login logic to store tokens with expiration timestamps
- Added automatic token validation and cleanup of expired tokens

### 2. Content Package Prompt Management
**Problem:** The content package mainPrompt contained many variables that were not properly substituted, causing application crashes. The complex prompt structure was also fragile when admins tried to customize it.

**Analysis:** Identified that the current implementation required explicit `.replace()` calls in the service layer for each placeholder, which was error-prone and didn't scale well.

**Proposed Solution:** Refactor the prompt management system to:
- Break the monolithic prompt into smaller, structured fields (pillarContentInstruction, repurposedContentInstruction, etc.)
- Implement an automated variable substitution system that detects and replaces placeholders automatically
- Create a more robust validation system to ensure all placeholders are properly substituted
- Update the UI to provide separate editable fields for each prompt section instead of one large textarea

### 3. Media Plan Data Persistence
**Problem:** New generated associated posts were not being saved to the database properly.

**Analysis:** Reviewed the `saveMediaPlanGroupToDatabase` implementation and found issues with how posts were being processed and saved.

**Proposed Solution:** 
- Ensure the media plan saving logic properly handles all post data including associated images
- Verify that the database service correctly persists both pillar content and repurposed content
- Add proper error handling and validation in the save process

## Key Technical Changes

### Authentication Service (`src/services/adminAuthService.ts`)
Created a new service with:
- `isAdminAuthenticated()`: Checks for valid auth tokens and handles expiration
- `authenticateAdmin(password: string)`: Validates password and sets persistent auth token
- `logoutAdmin()`: Clears auth tokens from localStorage
- `getAuthTimeRemaining()`: Returns time until token expiration

### App Component (`src/App.tsx`)
- Modified initial state initialization to check for existing auth tokens
- Updated login handler to store tokens with 3-day expiration
- Integrated new auth service functions

### Prompt Management System (Proposed)
- Refactor `ContentPackagePrompts` interface to use structured fields instead of a single `mainPrompt`
- Update `defaultPrompts.js` to break the master prompt into smaller, manageable parts
- Modify `geminiService.ts` to dynamically assemble prompts from structured fields
- Update `PromptManager.tsx` UI to render multiple text areas for each field

## Issues to Note

1. **Incomplete Prompt Management Implementation:** The prompt management refactoring was only partially implemented. The full solution requires updating multiple files including `types.ts`, `defaultPrompts.js`, `geminiService.ts`, and `PromptManager.tsx`.

2. **Media Plan Persistence:** The media plan saving issue was identified but not fully resolved. Additional work is needed to ensure posts are properly saved to the database.

3. **Missing Logout UI:** No logout button was found in the AdminPage component, which means users cannot manually log out.

## Preventative Measures for Future Sessions

1. **Always check for persistence requirements:** When implementing authentication or any state that should survive page reloads, always consider using localStorage or sessionStorage.

2. **Validate external data thoroughly:** When working with prompts or templates that contain placeholders, implement robust validation to ensure all placeholders are properly substituted.

3. **Break down complex features:** Large, monolithic features like the content package prompt should be broken into smaller, manageable components to improve maintainability and reduce errors.

4. **Test edge cases:** Always test authentication flows with expired tokens, invalid passwords, and page refreshes to ensure robustness.

5. **Provide user controls:** Always ensure users have appropriate controls (like logout buttons) for features that change their session state.