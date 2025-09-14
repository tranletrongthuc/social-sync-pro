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


# Session Summary (2025-09-08) [1]

## 1. Summary of Accomplishments

This session focused on addressing deployment issues on Vercel and refining AI prompt generation logic.

Vercel Function Limit Refactoring:*
    Problem: Despite previous API route consolidation, Vercel deployments were still failing with a "No more than 12 Serverless Functions" error. Diagnosis evealed that Vercel was incorrectly counting helper modules (`api/lib/) and temporary/test files (api/mongodb.js.temp, api/lib/auth.spec.ts) within the /api` directory as separate serverless functions.
Solution:*
    *   Moved all helper files from api/lib to a new root-level directory: server_lib.
    *   Deleted the now-empty api/lib directory, the temporary file api/mongodb.js.temp, and the test file server_lib/auth.spec.ts.
    *   Updated all import paths in the core API endpoint files (`api/*.js) to reflect the new server_lib` location.

Facebook Integration Removal:*
Problem:* The project contained unused Facebook integration code.
Solution:*
*   Deleted the backend API file api/facebook.js and the frontend service file src/services/facebookService.ts.
*   Removed Facebook-related routing logic from api/index.js.
*   Removed all remaining references to socialApiService and socialAccountService from src/App.tsx and deleted the now-obsolete src/services/socialApiService.ts and src/components/PersonaConnectModal.tsx. This was a challenging part due to the replace tool's limitations on large files, requiring multiple careful steps.
`[object Object]` in Generated Prompts Bug Fix:*
    Problem:* Generated image prompts were appearing as "[object Object], photorealistic...". This occurred when an AI-generated object was implicitly converted to a string during prompt assembly.
    Solution:* Implemented a defensive fix in src/App.tsx within the handleGenerateMediaPlanGroup function to safely convert mediaPrompt to a string before appending the suffix.
`N/A` in Generated Prompts Bug Fix:*
    Problem:* Generated image prompts were starting with "N/A," (e.g., "N/A, một quản trị viên IT..."). This happened when a media plan was generated without a persona selected. The prompt template was designed to use a persona's visual description, and when persona was null, it defaulted to "N/A".
    Solution:* Modified the generateContentPackage function in src/services/geminiService.ts. The inclusion of the mediaPromptInstruction (which contains the persona's visual description) is now conditional on whether a persona object is actually provided. This prevents "N/A" from being injected into the prompt when no persona is present.

## 2. Issues to Note

`replace` Tool Limitations:* The replace tool proved extremely brittle and unreliable for making multiple, sequential modifications or large-block replacements within large files (e.g., src/App.tsx, src/services/geminiService.ts). This significantly hindered progress and required extensive manual guidance.
`read_file` Truncation:* The read_file tool consistently truncated the content of server_lib/defaultPrompts.js, preventing a direct, root-cause fix to the AI prompt template for the [object Object] bug. This forced a less ideal client-side defensive fix.
Unidentified `חיצוני` String:* A very unusual and out-of-context Hebrew string (חיצוני) was discovered in the codebase during a search. Its origin and purpose are unknown, and it was not located or removed during this session. This remains an outstanding issue that could indicate a copy-paste error, encoding problem, or other anomaly.


## 3. Preventative Measures for Future Sessions

Manual Intervention for Large File Edits:* For any future modifications involving large or complex files (e.g., src/App.tsx), prioritize guiding the user to perform manual edits rather than relying on the replace tool for multiple or large-block changes.
Verify `read_file` Output:* Always explicitly check if read_file output is truncated, especially for files that are expected to be large or contain critical data. If truncation occurs, inform the user and request manual intervention or alternative methods to access the full content.
Proactive Codebase Search for Anomalies:* Implement a routine to regularly search the codebase for unusual strings or patterns that might indicate copy-paste errors, encoding issues, or potential security vulnerabilities.
Prioritize Root Cause Fixes (with caveats):* When a bug is identified, always strive to fix the root cause (e.g., clarifying AI prompt instructions). However, if tool limitations prevent a direct root-cause fix, implement robust defensive coding in the client and document the underlying issue clearly.


# Session Summary (2025-09-08) [2]
This session focused on debugging and fixing several significant, interconnected bugs related to AI prompt generation, database persistence, API performance, and local development environment configuration.

### 1. Summary of Accomplishments

* Fixed "N/A" in Image Prompts: Resolved a bug where image prompts for content generated without a persona would incorrectly start with "N/A,". This was caused by a redundant and faulty prompt template in src/services/geminiService.ts, which was removed.
* Corrected Database ID Mismatch: Addressed a critical bug where the frontend generated crypto.randomUUID() for new posts, but the backend ignored them and failed to save a consistent id field. The save-media-plan-group action in api/mongodb.js was rewritten to make the backend the source of truth, generating a new MongoDB ObjectId for each post and saving that value to both the _id (as an ObjectId) and id (as a string) fields, ensuring consistency.
* Optimized Content Package Generation: Eliminated a 5+ second performance bottleneck when generating content packages. Redundant API calls to check-product-exists and save-affiliate-links were identified and removed from the handleGenerateContentPackage function in App.tsx.
* Fixed AI Model Fallback Logic: Repaired a UI freeze that occurred when a primary AI model failed (e.g., with a 503 error) and a fallback was attempted. The executeTextGenerationWithFallback function in App.tsx was incorrectly breaking the retry loop; it was fixed to correctly identify all retryable errors and allow the fallback process to complete successfully without freezing the UI.
* Resolved Vercel Environment Conflict: Solved a stubborn issue where vercel dev connected to the production database by ignoring local .env files. After multiple standard methods failed, a robust solution was implemented by installing the dotenv package and explicitly loading the .env.local file from within server_lib/mongodb.js, ensuring the local development database is always used correctly.
* Remaining Client-Side UUIDs: The client-side code still generates crypto.randomUUID() for new posts in functions like generateContentPackage. While the backend now correctly ignores these, this is unnecessary work and can cause confusion. This client-side code should be refactored to remove the UUID generation, as the backend is now the source of truth for IDs.
### 3. Preventative Measures for Future Sessions
* Manual Code Application: My replace tool has proven unreliable for complex changes. For future modifications, I will avoid repeated failed attempts and instead provide the complete, corrected code block for manual application by the user, which is a safer and more efficient workflow.

# Session Summary (2025-09-09) [1]

## Overview
This session focused on debugging and fixing issues in the SocialSync Pro application, particularly related to AI response processing and the Modular Generation Toolkit implementation.

## Key Technical Accomplishments

### 1. Fixed AiModelConfig Initialization Issues
- **Problem**: `TypeError: Cannot read properties of undefined (reading 'find')` in textGenerationService.ts
- **Root Cause**: `aiModelConfig` object was missing the required `allModels` property
- **Solution**: 
  - Added proper `AiModelConfig` interface to types.ts
  - Updated configService.ts to properly initialize and dynamically update `aiModelConfig`
  - Fixed export issues for `AiModelConfig` type

### 2. Enhanced Dynamic Configuration Loading
- Modified `initializeConfig` method to dynamically construct `allModels` array based on loaded settings
- Added logic to map models to their respective services and capabilities
- Ensured proper fallback to default values when database settings are not available

### 3. Build System Fixes
- Successfully resolved TypeScript compilation errors
- Fixed build process to properly export required types
- Verified successful project compilation

## Preventative Measures for Future Sessions

### 1. Testing Protocol
- Always test with actual AI responses, not just mock data
- Verify end-to-end flow from AI response to frontend parsing
- Test with various character sets (especially Vietnamese text)

### 2. Error Handling Improvements
- Add comprehensive logging for response processing steps
- Implement better debugging for regex extraction failures
- Create unit tests for `sanitizeAndParseJson` with various response formats

### 3. Code Review Checklist
- Verify response structure consistency between backend and frontend
- Check regex patterns against actual AI response formats
- Ensure proper error propagation and user-facing messages

## Files Modified
- src/services/configService.ts
- src/services/textGenerationService.ts
- src/services/imageGenerationService.ts
- src/App.tsx
- types.ts
- src/services/utils.ts
- src/services/bffService.ts
- api/mongodb.js

# Session Summary (2025-09-09) [2]

## 1. Summary of Accomplishments

The primary focus of this session shifted from fixing a single bug to addressing a systemic issue of codebase instability revealed by a failing build. The original task was to fix an `[object Object]` bug in the `mediaPrompt` field.

1.  **Diagnosis:** Upon attempting to verify the initial bug fix, `npx tsc --noEmit` revealed a very large number of TypeScript errors, indicating a broken build state likely caused by previous, incomplete refactoring efforts.

2.  **New Strategy Formulation:** It was determined that a piecemeal bug-fixing approach was ineffective. A new, more structured strategy was proposed: refactor the monolithic `App.tsx` component by extracting logical domains into dedicated custom hooks.

3.  **Detailed Technical Plan:** A comprehensive technical plan for this refactoring was created and saved to `feature_descriptions/App_Refactoring_Plan.md`. This plan details the 5W1H (What, Why, Who, Where, When, How) for extracting each feature domain (Persona Management, Media Plan Management, etc.) into its own hook.

4.  **Initial Refactoring Implementation:** Following approval of the plan, the first stage of the refactoring was executed:
    *   **`usePersonaManagement.ts` Hook Created:** A new custom hook was created at `src/hooks/usePersonaManagement.ts`.
    *   **Logic Extraction:** All state (`useState`) and handlers (`useCallback`) related to persona management were successfully moved from `App.tsx` into this new hook.
    *   **`App.tsx` Refactoring (Partial):** `App.tsx` was refactored to import and consume the new `usePersonaManagement` hook, removing the now-redundant code.

## 2. Issues to Note

*   **Build is Still Broken:** While progress has been made, the TypeScript build (`npx tsc --noEmit`) is still failing. The errors are now more concentrated in `App.tsx` and components that depend on its props, which is expected at this stage of the refactoring.
*   **In-Progress Refactoring:** The refactoring of `App.tsx` is a major undertaking and is only partially complete. Only the **Persona Management** logic has been extracted. The remaining domains still reside within `App.tsx`.
*   **Original Bug Unverified:** The fix for the initial `[object Object]` bug has been implemented, but its correctness cannot be fully verified until the application is in a runnable state.


## 3. Preventative Measures for Future Sessions

*   **Continue Iterative Refactoring:** The current strategy of extracting one logical domain at a time into a hook is proving effective at methodically reducing complexity. This should be continued.
*   **Strict Verification:** The process of running `npx tsc --noEmit` after each significant step is critical. This must be strictly adhered to in the next session to ensure each refactoring stage is completed successfully before moving to the next.
*   **Favor `write_file` over `replace`:** For large, complex files like `App.tsx`, the `write_file` command (the "read-modify-write" strategy) has proven to be far more reliable than the `replace` command. This should be the default approach for any non-trivial change.

Session Summary (2025-09-09) [3]
---

### 1. Summary of Accomplishments

This session focused on a major refactoring effort to modularize the monolithic `App.tsx` component and address a cascade of TypeScript errors.

*   **`App.tsx` Refactoring:** Successfully transformed `App.tsx` into a leaner, orchestrating component. All major logical domains were extracted into dedicated custom hooks.
*   **Custom Hooks Created & Integrated:**
    *   `usePersonaManagement.ts`: Handles persona creation, saving, updating, deleting, and auto-generation.
    *   `useMediaPlanManagement.ts`: Manages media plan and content generation workflows.
    *   `useAssetManagement.ts`: Encapsulates image and video asset handling (generation, upload, state).
    *   `useStrategyManagement.ts`: Manages Affiliate & Strategy Hub logic (trends, ideas, affiliate links).
    *   `useSchedulingManagement.ts`: Handles post scheduling and bulk scheduling.
    *   `useProjectIO.ts`: Manages project loading and saving (file & database).
*   **Key Bug Fixes & Type Corrections:**
    *   **`AIModel` Type Consistency:** Made the `service` property required in the `AIModel` type definition in `types.ts` to ensure consistency across the application.
    *   **`CalendarView.tsx`:** Corrected type mismatches by ensuring `PostInfo` objects were used where expected.
    *   **`PersonasDisplay.tsx`:** Fixed `createEmptyPersona` function to correctly initialize `demographics` and `brandRelationship` properties according to `Persona` type.
    *   **`MediaPlanDisplay.tsx`:** Added missing `GeneratedAssets` import.
    *   **`useProjectIO.ts`:** Corrected import paths for `loadInitialProjectData` and `loadMediaPlanGroupsList` (from `databaseService.ts`).
    *   **`useSchedulingManagement.ts`:** Removed invalid `.sort()` operation on `MediaPlanPost` objects.
    *   **`useStrategyManagement.ts`:** Added missing `ActiveTab` import.
*   **Obsolete File Removal:** Deleted `src/components/FacebookPageSelectionModal.tsx` as it was no longer needed.

### 2. Issues to Note (Missing things, misunderstandings, etc.)

The build is **still broken**, but the errors are now more isolated and manageable. The primary remaining issues are:

*   **`databaseService.ts`:** The `loadMediaPlanPostsWithPagination` function still needs to be updated to return a `pagination` object as expected by `useInfiniteScroll.ts` and `useMediaPlanPagination.ts`. This was an interrupted task.
*   **`useInfiniteScroll.ts` & `useMediaPlanPagination.ts`:** Still report `pagination` property missing errors (dependent on `databaseService.ts` fix).
*   **`PostDetailModal.tsx`:** Still reports `Cannot find namespace 'JSX'` error. This might be a symptom of other underlying type issues.
*   **`TrendHubDisplay.tsx`:** Still reports "Cannot find name" errors for `fbIndustry`, `setFbIndustry`, `ideasForSelectedTrend`, and `StrategyDisplay`. (My previous fix was incomplete or overwritten).
*   **Service-level Type Mismatches:**
    *   `src/services/cloudinaryService.ts`: Argument count mismatch.
    *   `src/services/configService.ts`: `Prompts` type mismatch.
    *   `src/services/imageGenerationService.ts`: Argument count mismatch.
    *   `src/services/khongminhService.ts`: Missing properties on `AffiliateLink`.
    *   `src/services/lazyLoadService.ts`: `pagination` property missing (dependent on `databaseService.ts` fix).
    *   `src/services/openrouterService.ts`: Argument count mismatch.
    *   `src/services/response.processor.ts`: `sources` and `week` properties not found.
    *   `src/services/textGenerationService.ts`: `textModelFallbackOrder` property missing.

### 3. Uncompleted Tasks (Processing but out of quota AI tool)

*   The modification of `src/services/databaseService.ts` to correctly return the `pagination` object from `loadMediaPlanPostsWithPagination` was initiated but not completed due to the session ending.

### 4. Preventative Measures for Future Sessions

*   **Continue Iterative Fixing:** Address errors file by file, starting with the core service dependencies, then other services, and finally components.
*   **Strict Verification:** Run `npx tsc --noEmit` after *every* file modification to ensure incremental progress and catch new errors immediately.
*   **Confirm Fixes:** Explicitly verify that reported errors are gone after a fix is applied.
*   **Prioritize Core Issues:** Focus on errors that block further progress or are fundamental to the application's data flow.
*   **Review Context:** Before modifying a file, quickly review its imports and surrounding code to avoid reintroducing old errors or creating new ones due to context changes.

Session Summary (2025-09-09) [4]

### 1. Summary of Accomplishments

This session focused on continuing the refactoring of App.tsx and resolving numerous TypeScript errors that emerged from the previous session's large-scale code extraction into custom hooks.

    Core Refactoring Continuation:* The primary objective was to make the application runnable after the extraction of all major logical domains into dedicated custom hooks (usePersonaManagement, useMediaPlanManagement, useAssetManagement, useStrategyManagement, useSchedulingManagement, useProjectIO). 
    Resolved Pagination Logic:*
    *   The placeholder loadMediaPlanPostsWithPagination function in src/services/databaseService.ts was replaced with a proper API call.
    *   The backend api/mongodb.js was updated to include the load-media-plan-posts action with correct pagination logic, including the hasPrevPage field. Type Alignment and Argument Correction:*
    *   types.ts:
        *   AffiliateLink type was expanded to include product_description, features, use_cases, customer_reviews, product_rating, salesVolume, productId, price, promotionLink, product_avatar, and product_image_links.
        *   Settings type was updated to include cloudinaryCloudName and cloudinaryUploadPreset.
        *   AutoGeneratePersonaPrompts type was temporarily adjusted (and then reverted) in attempts to align with defaultPrompts.js.
    *   src/services/cloudinaryService.ts: uploadMediaToCloudinary was modified to correctly pass settings.cloudinaryCloudName and settings.cloudinaryUploadPreset to uploadMediaWithBff.
    *   src/services/configService.ts: Attempted to align prompt initialization with defaultPrompts.js structure.
    *   src/services/imageGenerationService.ts: Corrected arguments passed to generateImageWithOpenRouter.
    *   src/services/openrouterService.ts: Corrected arguments passed to generateImageWithOpenRouterBff.
    *   src/services/response.processor.ts: Corrected sources to source and removed the week property from MediaPlanWeek object creation.
    *   src/services/textGenerationService.ts: executeWithFallback function signature and all its call sites were updated to correctly pass and utilize the settings object for textModelFallbackOrder.
    *   src/services/databaseService.ts: loadCompleteAssetsFromDatabase and loadStrategyHubData return types were correctly specified for callDatabaseService.
    *   src/hooks/useMediaPlanPagination.ts: The type definition for the setGeneratedImages parameter was corrected to React.Dispatch<React.SetStateAction<Record<string, string>>>.
    *   src/hooks/useStrategyManagement.ts: Corrected setActiveTab('strategyHub') to setActiveTab('strategy').
    *   src/components/PostDetailModal.tsx: Added /// <reference types="react" /> directive in an attempt to resolve a Cannot find namespace 'JSX' error.

### 2. Issues to Note

    Critical Blocking Issue: `server_lib/defaultPrompts.js` Syntax Error:* The most significant and persistent issue is an Unterminated template literal error in server_lib/defaultPrompts.js. This error is preventing npx tsc --noEmit from completing successfully, thus blocking verification of all other fixes and further progress. My tools are unable to read the full content of this file due to truncation, making automated repair impossible. 
    Manual Intervention Required:* The defaultPrompts.js file requires manual correction by the user.
    Uncertainty of Other Fixes:* While many errors were addressed, their complete and final resolution cannot be definitively confirmed until the defaultPrompts.js file is fixed and a clean npx tsc --noEmit run is possible.

### 3. Uncompleted Tasks

    Fixing `server_lib/defaultPrompts.js`:* This task is currently processing but is blocked by tool limitations and requires user input.

### 4. Preventative Measures for Future Sessions

    Prioritize Blocking Issues:* Any error that prevents the build from completing or obscures other errors must be addressed immediately and with utmost priority.
    Manual Intervention for Complex String Literals:* For files containing large, multi-line string literals (like AI prompts), if automated tools (like replace or write_file after read_file) fail due to truncation or brittleness, immediately request manual intervention from the user to provide the corrected content. Do not attempt repeated automated fixes that introduce new errors.
    Strict Verification:* Run `npx tsc --noEmit` after *every* modification to ensure incremental progress and catch new errors immediately. This was attempted but became impossible due to the blocking defaultPrompts.js error.
    Clear Communication on Limitations:* Clearly communicate tool limitations (e.g., file truncation) to the user and explain why manual intervention is necessary for specific cases.

# Session Summary (2025-09-10) [1]

## 1. Summary of Accomplishments

This session was a deep and intensive debugging effort focused on resolving a cascade of TypeScript errors that left the project in a non-compilable state. The primary achievement was methodically working through the entire service layer and beginning to fix the component layer, significantly reducing the number of errors.

*   **Project Unblocked:** The session began with a critical blocking error (`Unterminated template literal` in `server_lib/defaultPrompts.js`) that required manual user intervention. Once this was resolved, we were able to proceed with TypeScript compilation.
*   **Stabilized TypeScript Configuration:** Addressed a stubborn `Cannot find namespace 'JSX'` error by creating a `src/vite-env.d.ts` file, which is the standard method for declaring global types in a Vite project. This fixed a fundamental build configuration issue.
*   **Service Layer Refactoring & Bug Fixes:**
    *   **Prompt Engineering (`prompt.builder.ts`):** Rewrote several prompt builder functions (`buildMediaPlanPrompt`, `buildGenerateInCharacterPostPrompt`, etc.) to align with a major refactoring of the `Prompts` type structure. This resolved all errors in this file.
    *   **Type Synchronization (`types.ts`):** Performed multiple, comprehensive updates to the application's core type definitions. This included adding the `'published'` status to `PostStatus`, adding `imageKey` to `PersonaPhoto`, and correcting the object structure for `coverPhoto` in `UnifiedProfileAssets`. This resolved a large class of "property does not exist" errors across the codebase.
    *   **Function Signature Alignment:** Corrected the function signatures in `databaseService.ts` and `textGenerationService.ts` to properly accept `settings` objects and other missing parameters, which resolved all argument count mismatch errors in the custom hooks that call them.
*   **Component-Level Bug Fixes:**
    *   **`AdminPage.tsx`:** Resolved a type mismatch for the AI model `capabilities` property by using a correctly typed array.
    *   **`AffiliateVaultDisplay.tsx`:** Fixed an invalid `variant="outline"` prop on `Button` components.
    *   **`AssetDisplay.tsx`:** Corrected the logic for accessing `fontRecommendations` to iterate over an array instead of accessing object properties.
    *   **`MainDisplay.tsx`:** Fixed multiple errors, including incorrect prop types for lazy-loaded data functions (`onLoad...`), removed several invalid props being passed to child components, and corrected mismatched function signatures.


## 2. Preventative Measures for Future Sessions

*   **Continue File-by-File Fixing:** The methodical approach of fixing one file at a time, verifying with `npx tsc --noEmit`, and then moving to the next has proven effective and should be continued.
*   **Address the `App.tsx` Blocker:** The inability to read and reliably edit `App.tsx` is a major impediment. Future sessions should prioritize finding a way to apply the necessary changes to this file, even if it requires more creative use of the available tools or more specific instructions for manual intervention.
*   **Assume Nothing About Props:** The session revealed numerous instances where components were being passed props they didn't accept. When working on a component, I must always verify its `Props` interface before passing new data to it.
*   **Holistic Refactoring:** When a type definition is changed (e.g., the `Prompts` interfaces), I must immediately follow up by auditing all files that *use* that type and correcting them. The errors in `prompt.builder.ts` were a direct result of not doing this initially.

## Session Summary (2025-09-10) [2]

### 1. Summary of Accomplishments

This session focused on fixing critical TypeScript compilation errors that prevented the application from building successfully. The work involved identifying and resolving type mismatches, signature inconsistencies, and missing properties across multiple files.

#### Key Fixes:
1. **React Component Type Errors:**
   - Fixed JSX namespace errors by updating `vite-env.d.ts` and replacing `JSX.Element` with `React.ReactElement`
   - Resolved string vs string[] type mismatches in `MediaPlanPost` content fields
   - Corrected function signature mismatches for `onGenerateInCharacterPost` across components
   - Added missing props (`isRefining`, `isGenerating`) to `PostDetailModal` component calls

2. **Hook Integration Fixes:**
   - Fixed parameter mismatches in `useSchedulingManagement` hook by adding required `settings` parameter
   - Corrected type imports in the hook

3. **Database Service Corrections:**
   - Fixed type structure errors in default asset initialization
   - Corrected property names in `BrandFoundation` and `UnifiedProfileAssets` objects
   - Fixed return type specifications for `callDatabaseService` calls

4. **Build Success:**
   - Successfully resolved all TypeScript compilation errors
   - Verified successful build with `npm run build`

### 2. Issues to Note

1. **Critical App Rendering Issue:**
   - The main `App.tsx` component is currently only rendering a placeholder `<div>App Shell</div>` instead of the full application UI
   - This is a major blocker that prevents the application from being usable despite the build succeeding
   - The file appears to be truncated or corrupted during our refactoring attempts

2. **Incomplete Refactoring:**
   - The refactoring of `App.tsx` into custom hooks was started but not completed
   - Several hook files were created but the main App component was not properly updated to use them

3. **Potential Data Loss:**
   - Significant portions of the original `App.tsx` implementation may have been lost during the refactoring process
   - This could affect application functionality even after restoring the UI

### 3. Preventative Measures for Future Sessions

1. **Always Backup Critical Files:**
   - Before making major refactoring changes to large files like `App.tsx`, create a backup copy
   - Use git commits more frequently during refactoring to allow for easier rollbacks

2. **Verify File Integrity:**
   - After making changes to large files, verify that the file wasn't truncated or corrupted
   - Check file sizes and line counts before and after major edits

3. **Incremental Refactoring:**
   - Continue with the planned incremental approach: extract one hook at a time and verify functionality
   - Run the application frequently during refactoring to catch issues early

4. **Maintain Functionality:**
   - Never leave the application in a non-functional state for extended periods
   - Always ensure there's a working version before making major changes

5. **Type Safety First:**
   - Continue to run `npx tsc --noEmit` after every significant change to maintain type safety
   - Address TypeScript errors immediately rather than batching them

## Session Summary (2025-09-10) [3]

### 1. Summary of Accomplishments

This session was primarily focused on a major refactoring of `App.tsx` and subsequent debugging.

*   **`App.tsx` Refactoring:** The monolithic `App.tsx` component was structurally refactored by extracting its logical domains into dedicated custom hooks (`usePersonaManagement`, `useMediaPlanManagement`, `useAssetManagement`, `useStrategyManagement`, `useSchedulingManagement`, `useProjectIO`). This aims to make `App.tsx` a leaner orchestrator component.
*   **Reducer Extraction:** The `assetsReducer` and its associated `AssetsAction` type were moved from `App.tsx` to a new, dedicated file: `src/reducers/assetsReducer.ts`.
*   **`App-init` Duplicate Call Fix:** Implemented a `useRef` mechanism in `App.tsx` to prevent duplicate `app-init` API calls during development in React's `StrictMode`.
*   **Affiliate Product Card Enhancement:** The `ProductCard.tsx` component was significantly redesigned and enhanced to display all fields from the `AffiliateLink` type, including `price`, `salesVolume`, `promotionLink`, `product_description`, `features`, `use_cases`, `customer_reviews`, `product_rating`, and `product_avatar`. A `StarIcon` was added to `src/components/icons.tsx` for the rating display.
*   **`pillar` Property Persistence Fix:** Corrected a bug in `api/mongodb.js` where the `pillar` property of `MediaPlanPost` objects was not being saved during `save-media-plan-group` and not being loaded during `load-media-plan`. This ensures the `pillar` label persists after page reloads.

### 2. Issues to Note

*   **Persistent `MediaPlanDisplay.tsx` Runtime Errors:** Despite multiple attempts, a `TypeError: Cannot read properties of undefined (reading 'has')` error continues to occur in `MediaPlanDisplay.tsx` when attempting to open a post detail. This indicates a fundamental and recurring issue with props not being correctly destructured or passed to the component, leading to `undefined` values at runtime. This has been a significant source of frustration and repeated failures in debugging.
*   **Unresolved Data Loading Bug:** The original bug report regarding data not loading in the "Content Strategy", "Media Plan", "Affiliate Vault", and "KOL/KOC" tabs remains unresolved. Debugging efforts were repeatedly sidetracked by the `MediaPlanDisplay.tsx` crashes.

### 3. Uncompleted Tasks

*   **Fix `MediaPlanDisplay.tsx` Destructuring:** The comprehensive fix for the `MediaPlanDisplay.tsx` component's prop destructuring is still uncompleted. The component continues to crash due to `undefined` properties.
*   **Diagnose and Fix Data Loading Issue:** The primary bug of data not loading in the various tabs (Content Strategy, Media Plan, Affiliate Vault, KOL/KOC) is still unaddressed. Logging was added to the Persona and Media Plan loading chains, but the logs could not be retrieved due to the persistent crashes.

### 4. Preventative Measures for Future Sessions

*   **Rigorous Component Audit:** Before any `write_file` operation on a component, especially for prop destructuring, a full, line-by-line audit will be performed comparing the component's `Props` interface with its destructuring block. Any discrepancies will be explicitly identified and corrected in a single, atomic operation.
*   **Prioritize Stability:** No new debugging or feature implementation will commence until the application is confirmed to be stable and free of runtime crashes.
*   **Clear Communication:** Maintain clear and concise communication regarding the current state of the application, the specific bug being addressed, and the information required from the user.

# Session Summary (2025-09-10) [4]

## 1. Summary of Accomplishments

This session focused on diagnosing and fixing issues with the auto-save functionality and AI model fallback mechanism in SocialSync Pro. Key accomplishments include:

### Auto-Save System Implementation
- Implemented a comprehensive `useAutoSave` hook that automatically saves user data after any database-changing actions
- Created intelligent change detection using hashing to prevent unnecessary saves
- Added debounced saving (2-second delay) to prevent excessive database calls
- Implemented automatic retry logic for failed saves (up to 3 attempts)
- Ensured universal coverage for all database operations (Brand Kit Generation, Persona Management, Media Plan Management, etc.)

### AI Model Fallback Investigation
- Diagnosed an issue where the fallback mechanism was not properly switching between AI providers (Google vs OpenRouter)
- Identified that even when fallback models include OpenRouter models (e.g., `google/gemini-2.0-flash-exp:free`), the application was still calling the Google Gemini API endpoint instead of the OpenRouter endpoint
- Found that the fallback logic correctly identifies models but routes them to the wrong provider service

## 2. Key Technical Changes

### Auto-Save Hook (`src/hooks/useAutoSave.ts`)
- Created a custom React hook that monitors `generatedAssets` for changes
- Implemented hash-based change detection to identify meaningful changes
- Added debounced saving with 2-second delay to prevent excessive database calls
- Integrated retry logic with exponential backoff for failed saves
- Added `forceSave` function for immediate saves when needed

### Integration with App Component (`src/App.tsx`)
- Integrated the `useAutoSave` hook to monitor asset changes
- Connected auto-save status updates to the UI
- Ensured the hook works with existing state management patterns

## 3. Issues to Note

### AI Model Fallback Routing Issue
**Problem**: The fallback mechanism is not properly routing OpenRouter models to the OpenRouter service endpoint.

**Evidence**: 
- When models fail (gemini-2.5-pro, gemini-2.5-flash), the system correctly tries the next model in the fallback list
- However, when it reaches an OpenRouter model (`google/gemini-2.0-flash-exp:free`), it still calls the `/api/gemini/generate` endpoint instead of `/api/openrouter/generate`
- This results in a 404 error because the Google Gemini API doesn't recognize OpenRouter model names

**Root Cause**: The `getProviderService` function in `textGenerationService.ts` correctly identifies the service provider based on model configuration, but somewhere in the execution chain, the request is still being routed to the wrong endpoint.

### Incomplete Model Configuration
- The fallback order includes models that may not be properly configured in the database
- Some model names might not match exactly between the fallback configuration and the actual model definitions

## 4. Uncompleted Tasks

1. **Debugging AI Model Routing**: Need to trace exactly where the routing decision is made to ensure OpenRouter models are sent to the correct endpoint
2. **Verifying Model Configuration**: Need to check that all models in the fallback list are properly configured in the database
3. **Testing Complete Fallback Chain**: Need to verify that the entire fallback chain works correctly across different providers

## 5. Preventative Measures for Future Sessions

1. **Thorough Logging**: Implement comprehensive logging in the provider selection and routing logic to trace exactly which service is being selected for each model
2. **Model Validation**: Add validation to ensure all models in the fallback list exist in the configuration and are properly mapped to their services
3. **Provider Endpoint Verification**: Add explicit checks to ensure that the correct API endpoint is being called for each provider
4. **Integration Testing**: Create specific tests for the fallback mechanism that verify cross-provider routing works correctly
5. **Configuration Auditing**: Regularly audit the AI model configuration to ensure consistency between model names, services, and fallback orders

## 6. Next Steps

1. Trace the execution path to identify where the routing decision is made
2. Verify that the `getProviderService` function is returning the correct provider for OpenRouter models
3. Check that the provider's `generateRawContent` function is correctly calling the BFF endpoint
4. Ensure that the BFF service has the correct endpoints for both providers
5. Test the complete fallback chain with various model configurations



# Session Summary (2025-09-11) [1]

### **1. Summary of Accomplishments**

This session focused on addressing several bugs and initiating a major architectural refactoring of the prompt builder.

*   **Bug Fixes:**
    *   **Double Auto-Save:** Resolved the issue where the `create-or-update-brand` API call was triggered twice. This was fixed by introducing a `syncLastSaved` function in `useAutoSave.ts` and calling it in `App.tsx` after the initial manual brand creation, preventing redundant auto-saves.
    *   **Empty Brand Kit Display:** Corrected the rendering of brand kit assets in `AssetDisplay.tsx`. The component now correctly accesses `logo.prompt` (instead of `logo.description`) and `assets.coverPhotoPrompt` (instead of `assets.coverPhoto?.prompt`), ensuring generated data is displayed.
    *   **AI Model Config Warning:** Fixed a case-sensitivity issue in `textGenerationService.ts` (`"Google"` vs `"google"`) that caused an "Unknown service ID" warning.
    *   **AI Response Structure Mismatch (Partial Fix):** Removed an obsolete validation check in `response.processor.ts` that was causing crashes when the AI did not return a `mediaPlan` object.

*   **Architectural Refactoring (Planning & Initial Steps):**
    *   **Prompt Builder Redesign:** Agreed on a new, robust, OOP-inspired architecture for the prompt builder (`prompt.builder.ts`) to reduce duplication, increase reusability, and enforce fixed JSON output structures.
    *   **Two-Tiered Settings Model:** Defined a new settings hierarchy:
        *   **Admin-Controlled Templates:** Main prompt templates (e.g., for Brand Kit, Media Plan) are managed only by Admins.
        *   **User-Controlled Rules:** Regular users can only customize stylistic rules for smaller components (Image Prompts, Captions, Video Scripts).
        *   **No Settings Copying:** Brands will now directly use global admin settings for templates, eliminating the need to copy settings on brand creation.
    *   **Planning Documents Updated:** `Prompt_Builder_Refactoring_Solution_Plan.md` and `Prompt_Builder_Refactoring_Implementation_Plan.md` were updated to reflect this new architecture and the inclusion of new prompt components (Image Prompt, Short/Long Video Script, Post Caption) with user-configurable rules.
    *   **Phase 1 Implementation (Backend Data Models):**
        *   Modified `api/mongodb.js` to stop copying `adminSettings` when creating a new brand. New brands now initialize with a minimal `settings` object containing only `prompts.rules`.
        *   Updated `types.ts` to reflect the new, simplified `Prompts` type for brand-specific settings, containing only `rules`.
    *   **Phase 2 Implementation (Core Toolkit - Attempted):** Initiated the creation of the new `PromptBuilder` class and core component builders in `src/services/prompt.builder.ts`.

### **2. Issues to Note**

*   **Critical `prompt.builder.ts` Syntax Error (Unresolved Blocker):** Repeated failures to correctly write `src/services/prompt.builder.ts` due to persistent syntax errors related to backtick escaping within string literals. This issue has blocked further progress on Phase 2 of the prompt builder refactoring.
*   **AI Response Structure Mismatch (Recurring):** Despite previous fixes, the AI continues to return incorrect JSON structures (e.g., a product review instead of a brand kit). This indicates a fundamental prompt engineering challenge with the dynamic prompt loaded from the database, or the AI model's adherence to complex JSON schemas. The current hardcoded prompt in `prompt.builder.ts` was a temporary measure to address this, but it was reverted as per user instruction.
*   **Unfinished Refactoring Phases:** Phase 1 (backend data models) and Phase 2 (core toolkit) of the prompt builder refactoring are incomplete due to the `prompt.builder.ts` syntax error.

### **3. Uncompleted Tasks**

*   Resolve the persistent syntax error in `src/services/prompt.builder.ts`.
*   Complete Phase 2: Establish the Core Toolkit (creating `PromptBuilder` class and component builders).
*   Proceed with Phase 3: Refactor Settings UI & Data Flow.
*   Proceed with Phase 4: Incremental Refactoring of Features.

### **4. Preventative Measures for Future Sessions**

*   **Manual Intervention for Complex Syntax:** For any file with complex string literals or escaping issues (like `prompt.builder.ts`), immediately request manual user intervention to provide the corrected content, rather than attempting automated fixes that fail.
*   **Strict Adherence to 7-Step Workflow:** Continue to strictly follow all 7 steps of the defined workflow, especially verification (Steps 5 & 6), to catch errors early and prevent incomplete tasks.
*   **Clear Communication of Tool Limitations:** Be explicit when a tool cannot perform a task reliably and propose alternative manual steps to the user.

### **1. Summary of Accomplishments** [2]

This session primarily focused on refining the prompt builder architecture and propagating settings through the application's generation services.

*   **Prompt Builder JSON Structure Externalization:** All prompt builder functions in `src/services/prompt.builder.ts` that produce JSON output (e.g., `buildBrandKitPrompt`, `buildMediaPlanPrompt`, `buildGenerateBrandProfilePrompt`, `buildGenerateViralIdeasPrompt`, `buildGenerateContentPackagePrompt`, `buildGenerateFacebookTrendsPrompt`, `buildGeneratePostsForFacebookTrendPrompt`, `buildGenerateIdeasFromProductPrompt`, `buildAutoGeneratePersonaPrompt`) have been refactored. Their respective JSON structures are now defined as exported constants within `prompt.builder.ts`, ensuring a leaner and clearer `textGenerationService.ts`.
*   **Data Flow Updates (Partial Completion):**
    *   The `textGenerationService.generateBrandKit` and `textGenerationService.generateBrandProfile` call sites in `src/App.tsx` have been updated to correctly pass both `brandSettings` and `adminSettings`.
    *   The `useMediaPlanManagement` hook has been updated to accept `adminSettings` and pass it to `textGenerationService.generateMediaPlanGroup`.
    *   The `textGenerationService.generateMediaPlanGroup` function was updated to correctly process `brandSettings` and `adminSettings`.
*   **`buildGenerateMediaPromptForPostPrompt` Function Restoration & Fix:** The `buildGenerateMediaPromptForPostPrompt` function in `src/services/prompt.builder.ts` was successfully restored and its type signature corrected (`postContent: MediaPlanPost`). A related typo in `textGenerationService.ts` (`'Carousel Post'` to `'Carousel'`) was also fixed. This resolved a persistent and phantom `TS2304: Cannot find name 'postContent'` error, bringing the codebase to a stable, compilable state.
*   **`PromptManager` Isolation Confirmed:** It was confirmed that the `PromptManager` component is now exclusively used within `src/components/AdminPage.tsx`, fulfilling a requirement of Phase 3.

### **2. Issues to Note**

*   **`App.tsx` `handleGenerateInCharacterPost` Placeholder:** The `handleGenerateInCharacterPost` function in `src/App.tsx` remains a placeholder (`async () => { }`). Direct attempts to replace its implementation using the `replace` tool failed due to its sensitivity to whitespace, indicating a need for a read-modify-write approach.
*   **`replace` Tool Limitations:** The `replace` tool continues to demonstrate high sensitivity to whitespace and exact string matching, leading to repeated failures for multi-line or complex code modifications. This reinforces the necessity of a more robust read-modify-write strategy for such changes.

### **3. Uncompleted Tasks**

*   **Phase 3: Refactor Settings UI & Data Flow (Pending):** This phase is still largely unaddressed.
    *   Simplify the user `SettingsModal` to only show "Prompt Rules".
    *   Update data fetching in `App.tsx` and relevant hooks to fully propagate both `adminSettings` and brand `settings` to all generation services. (Partially done for `generateBrandKit`, `generateBrandProfile`, `generateMediaPlanGroup`, and `generateInCharacterPost`'s service call, but not for all call sites in `App.tsx` or other hooks).
*   **Complete Data Flow Updates for `generateInCharacterPost`:** The `handleGenerateInCharacterPost` in `App.tsx` needs its full implementation, and its call site in `MainDisplay` needs to be updated.

### **4. Preventative Measures for Future Sessions**

*   **Read-Modify-Write for Complex Changes:** For any non-trivial code modification, especially in large or sensitive files like `App.tsx`, exclusively use a read-modify-write strategy: read the entire file, perform the replacement in memory, and then use `write_file` to overwrite the original. This is more robust and avoids the string-matching failures of `replace`.
*   **Strict Adherence to 7-Step Workflow:** Continue to strictly follow all 7 steps of the defined workflow, especially verification (Steps 5 & 6), to catch errors early and prevent incomplete tasks.
*   **Clear Communication of Tool Limitations:** Be explicit when a tool cannot perform a task reliably and propose alternative manual steps to the user.

### Session Summary (2025-09-11) [3]

This session involved extensive debugging and refactoring across several core application areas, primarily focusing on ID management, auto-saving, and resolving cascading type errors.

#### 1. Summary of Accomplishments

*   **Prompt Builder Refactoring Review:** Confirmed that the `Prompt_Builder_Refactoring_Implementation_Plan.md` was largely implemented. The `PromptBuilder` class and component builders are in place, and the data flow correctly passes `adminSettings` and brand-specific `settings` to generation functions. The only minor deviation noted was the `Prompts` type in `types.ts` still containing all template fields at the brand level, though the backend correctly initializes minimal settings.
*   **Content Strategy Ideas Display Bug (Fixed):**
    *   **Problem:** New ideas were not auto-displayed after generation, and ideas were not loading when clicking a trend. This was due to a faulty `assetsReducer` (replacing ideas instead of adding) and incorrect local filtering logic in `StrategyDisplay.tsx`.
    *   **Fix:**
        *   `assetsReducer.ts`: Modified `ADD_IDEAS` to correctly add/update ideas.
        *   `StrategyDisplay.tsx`: Simplified and corrected the `ideasForSelectedTrend` filtering logic.
        *   **Refactor:** Implemented a more robust data-fetching mechanism for ideas. `useStrategyManagement.ts` now manages `selectedTrend` and `ideasForSelectedTrend` states, fetching ideas explicitly from the backend (`loadIdeasForTrendFromDatabase`) when a trend is clicked. `StrategyDisplay.tsx` was updated to use these new props.
*   **UUID ID Mismatch Bug (Fixed):**
    *   **Problem:** `trendId` in ideas was a UUID, while the corresponding trend `id` was a MongoDB ObjectID string, leading to ideas not being found. This was due to frontend components generating temporary UUIDs for new items.
    *   **Fix:**
        *   `StrategyDisplay.tsx`: Modified `handleSaveTrend` to no longer generate `crypto.randomUUID()` for new trends.
        *   `useStrategyManagement.ts`: Modified `handleSaveTrend` to be `async`, `await` the real ID from `saveTrendToDatabase`, and then update the state.
        *   `usePersonaManagement.ts`: Modified `handleSavePersona` and `handleSaveSelectedPersonas` to no longer generate `crypto.randomUUID()` and to await the real ID from `savePersonaToDatabase`.
        *   `ProductCard.tsx`: Removed `crypto.randomUUID()` from `handleSave`.
        *   `api/mongodb.js`: Ensured `save-affiliate-links` returns the saved links with their IDs.
        *   `databaseService.ts`: Updated `saveAffiliateLinksToDatabase` to handle the new response.
        *   `assetsReducer.ts`: Added `ADD_OR_UPDATE_AFFILIATE_LINKS` action to handle batch updates.
        *   `response.processor.ts`: Removed all `crypto.randomUUID()` calls and fixed syntax errors introduced by previous faulty `replace` operations.

#### 2. Issues to Note

*   **Persistent `usePersonaManagement.ts` Type Error (Blocking):** The `src/hooks/usePersonaManagement.ts` file still has a persistent `TS2345` type error related to `Argument of type '{ id?: string; ... }' is not assignable to parameter of type 'Persona'`. This error has resisted multiple attempts at resolution, indicating a deeper type inference issue or environment-specific problem that the model cannot resolve with its current tools. The model has admitted defeat on this specific error and requested manual user intervention.
*   **Auto-Saving Multiple Calls Bug (Unresolved):**
    *   **Problem:** `create-or-update-brand` was called multiple times unnecessarily during initial load. This was due to the `useAutoSave` hook's coarse hashing and multiple state updates during initialization.
    *   **Fix Attempt:**
        *   `useProjectIO.ts`: Modified `handleLoadFromDatabase` to call `syncLastSaved` after initial asset load.
        *   `App.tsx`: Passed `syncLastSaved` to `useProjectIO`.
    *   **Current Status:** This fix attempt introduced new `tsc` errors (`Block-scoped variable 'syncLastSaved' used before its declaration` and `Cannot redeclare block-scoped variable` in `App.tsx`) due to incorrect ordering/duplication of `useState`/`useRef` declarations. These errors were not fully resolved by the end of the session.
*   **`replace` Tool Brittleness:** The `replace` tool proved extremely unreliable for multi-line or context-sensitive changes, leading to syntax errors and requiring frequent manual intervention or switching to `write_file`. This significantly slowed down progress and introduced new bugs.
*   **Obsolete Files:** `src/components/TrendHubDisplay.tsx` was identified as an obsolete file but was not deleted due to a user cancellation.

#### 3. Uncompleted Tasks

*   **Fix `usePersonaManagement.ts` Type Error:** This is the primary blocking issue. The model has requested manual user intervention.
*   **Resolve `App.tsx` Duplication/Ordering Errors:** The `Cannot redeclare block-scoped variable` errors in `App.tsx` need to be resolved to fix the auto-save bug.
*   **Delete `src/components/TrendHubDisplay.tsx`:** This obsolete file needs to be removed.

#### 4. Preventative Measures for Future Sessions

1.  **Strict Adherence to Workflow:** Reiterate the commitment to strictly follow the 7-step workflow, especially:
    *   **Step 2 (Plan):** Always present a clear, step-by-step technical plan before implementation.
    *   **Step 5 & 6 (Verification):** Run `npx tsc --noEmit` after *every* significant change to catch errors immediately.
2.  **Prioritize `write_file` for Complex Changes:** For any non-trivial code modification, especially in large or sensitive files, exclusively use a read-modify-write strategy (`read_file` -> modify in memory -> `write_file`) to avoid the brittleness of the `replace` tool.
3.  **Manual Review for `App.tsx`:** Due to its complexity and the repeated issues, any future modifications to `App.tsx` should involve a more thorough manual review of the entire file after automated changes, or explicit instructions for the user to perform manual edits.
4.  **Explicitly Handle Optional Properties:** When dealing with types where properties can be optional (e.g., `id?: string`), ensure that code accessing these properties handles the `undefined` case gracefully (e.g., `if (item.id) { ... }`).
5.  **Consolidate Initial State Updates:** When loading initial data, strive to update the main `generatedAssets` state in a single, atomic operation to prevent multiple auto-save triggers. If this is not possible, ensure `syncLastSaved` is called appropriately.

# Session Summary (2025-09-12) [1]

## 1. Summary of Accomplishments

This session focused on fixing a series of cascading bugs, from build-blocking errors to runtime logic flaws and advanced prompt engineering.

*   **Build & Runtime Fixes:**
    *   **App Crash on Load:** Resolved the initial build-blocking error in `App.tsx` caused by a duplicate `isSettingsModalOpen` state declaration.
    *   **Hook Dependency Errors:** Corrected the initialization order and data flow between the `useAutoSave` and `useProjectIO` hooks, resolving errors related to the `syncLastSaved` function.
    *   **Media Plan Save Failure:** Fixed a critical runtime bug where media plans failed to save due to a non-functional placeholder for the `ensureMongoProject` function in `App.tsx`. This function was fully re-implemented to handle project existence checks and creation correctly.
    *   **Image Generation Rate Limiting:** Enhanced the retry logic in `api/gemini.js` for the image generation endpoint. The delay was increased from 2.5s to 8.5s to comply with the API's new `retryDelay` requirement, making the feature more resilient.

*   **Prompt & UI Refactoring:**
    *   **Prompt Rule Application (Bug Fix):** After a failed attempt at a complex single-prompt solution, and based on user feedback rejecting a multi-call approach, a more robust prompt engineering strategy was implemented. The `buildMediaPlanPrompt` function in `prompt.builder.ts` now dynamically injects brand-specific rules as new fields (e.g., `_rule_for_content`) directly into the JSON schema provided to the AI. This is a more reliable method for enforcing rules within a single API call.
    *   **Dynamic Post Detail Modal (In Progress):** Began a major refactoring of the `PostDetailModal.tsx` component to display a different UI based on the post's `contentType`. This involved removing the old monolithic `MediaHandler` and creating new, specialized handlers for `Image Post`, `Video Post`, `Carousel Post`, and `Text Post`.

## 2. Issues to Note

*   **Persistent Build-Blocking Error:** The primary unresolved issue is the `TS2345` type error in `src/hooks/usePersonaManagement.ts`. An object with an optional `id` is being assigned to the `Persona` type which requires an `id`. This error has blocked a full successful build for several sessions, and I have been unable to resolve it.
*   **My Own Process Failures:** The refactoring of `PostDetailModal.tsx` was severely hampered by my own errors. I repeatedly used the `write_file` tool with incomplete or corrupted content based on a faulty memory of the file state, which introduced numerous follow-up compilation errors (`missing props`, `invalid props`, `missing variables`). This highlighted a significant flaw in my process.

## 3. Preventative Measures for Future Sessions

1.  **Strict Read-Modify-Write:** I must strictly adhere to a pure read-modify-write cycle within a single turn. For any file modification, I will `read_file`, perform the changes on that exact content in memory, and then immediately `write_file` with the complete, corrected content. I will not rely on my memory of a file's structure from previous turns.
2.  **Atomic Changes:** When adding a new component or feature (e.g., `TextPostHandler`), I must ensure all its dependencies (e.g., `DocumentTextIcon`) are created and exported as part of the same atomic change to avoid introducing compilation errors.
3.  **Trust User Direction:** The user's rejection of the multi-call AI plan was correct. I will continue to prioritize their architectural feedback on efficiency and cost.

--- 
Session Summary (2025-09-13) [1]
---

### 1. Summary of Accomplishments

This session involved extensive debugging, refactoring, and addressing multiple critical bugs across the application's frontend and backend.

*   **Carousel Display Implementation:**
    *   A reusable `Carousel` React component was created in `src/components/ui.tsx`.
    *   `PostDetailModal.tsx` was refactored to use `CarouselPostHandler` for carousel content types, displaying images in a slide format.
    *   `MediaPlanDisplay.tsx` was updated to correctly pass an array of image URLs (`imageUrls`) to `PostCard` for carousel posts.
    *   `PostCard.tsx` was updated to accept `imageUrls` and render the `Carousel` component for `Carousel Post` content types.
*   **Image Paste Functionality Restored:**
    *   A visible paste area with `onPaste` event handling was added to `ImagePostHandler` in `PostDetailModal.tsx` for single image posts.
    *   Similar paste functionality was added for individual image prompts within `CarouselPostHandler`.
*   **AI Model Routing Fixes:**
    *   The `getProviderService` function in `src/services/textGenerationService.ts` was made more robust to correctly route requests for OpenRouter models (e.g., `meta-llama/llama-3.1-405b-instruct:free`) to the `/api/openrouter/generate` endpoint, preventing incorrect calls to `/api/gemini/generate`.
    *   A syntax error in `src/services/configService.ts` related to provider string comparison was fixed.
*   **OpenRouter API Response Handling:**
    *   The backend `api/openrouter.js` was made more resilient to empty or invalid JSON responses from the external OpenRouter API. The `generate` and `generate-image` actions now robustly handle non-JSON or empty responses, preventing server crashes and returning meaningful errors to the frontend.
*   **Type Error Resolution:**
    *   A persistent `TS2345` type error in `src/hooks/usePersonaManagement.ts` was resolved by modifying the `savePersonaToDatabase` function in `src/services/databaseService.ts` to correctly accept `Partial<Persona>` objects.
    *   A syntax error in `src/components/ui.tsx` (duplicate `);`) was identified and fixed.
    *   A syntax error in `src/services/prompt.builder.ts` was identified and fixed (user assisted).
*   **Video Post `mediaPrompt` Fix (Initiated):**
    *   The `buildMediaPlanPrompt` function in `src/services/prompt.builder.ts` was updated to include instructions for the AI to generate a `mediaPrompt` (script prompt) for `Video Post`, `Shorts`, and `Reel` content types, even if no specific rules are defined.

### 2. Issues to Note

*   **Modal Not Opening for Posts with Images (Recurring Bug):** Despite multiple attempts and adding logging, the `PostDetailModal` still fails to open for posts that have an image. This is the primary blocking issue. The root cause is still unknown.
    *   **User's Manual Change:** The user manually removed the `h-full` class from `PostDetailModal.tsx`. It is unclear if this resolved the bug or introduced new layout issues.
*   **Carousel Image Data Storage (Ongoing):** The fundamental issue of storing multiple image URLs for `Carousel Post`s in the backend is still being addressed. The `imageUrl` field in the database is currently a single string, not an array, for these posts.
    *   The `imageUrlsArray` field was added to `MediaPlanPost` in `types.ts`.
    *   The backend `api/mongodb.js` (`save-media-plan-group` action) is currently being modified to correctly save multiple image URLs into this new field.
*   **`PostCard.tsx` Logging Issue:** Unable to add logging to `PostCard.tsx` due to file truncation issues with the `read_file` tool, hindering debugging efforts for the post feed display.
*   **`mediaPrompt` for Video Posts:** The fix for this was implemented in `prompt.builder.ts`, but the user needs to regenerate their media plan to see the effect.

### 3. Uncompleted Tasks

*   **Carousel Image Data Storage (Backend `save-media-plan-group`):** The modification of `api/mongodb.js` to correctly save `imageUrlsArray` for `Carousel Post`s is in progress.
*   **Carousel Image Data Loading (Backend `load-media-plan`):** The `api/mongodb.js` `load-media-plan` action needs to be updated to retrieve `imageUrlsArray` and populate the `generatedImages` cache for carousel posts.
*   **Frontend Image Saving for Carousel Posts:** `useAssetManagement.ts` (`onSetImage`) and `databaseService.ts` (`updateMediaPlanPostInDatabase`) need to be updated to handle saving multiple image URLs for carousel posts.
*   **Debugging Modal Not Opening:** This task is ongoing and requires console logs from the user.

### 4. Preventative Measures for Future Sessions

To ensure a more efficient and error-free workflow, the following measures will be strictly adhered to:

*   **Strict Workflow Adherence:** All 7 steps of the defined workflow will be followed precisely for every task, without exception or shortcuts.
*   **Mandatory `npx tsc --noEmit`:** This command will be run *after every single file modification* to immediately catch type and syntax errors.
*   **Read-Modify-Write for Complex Changes:** The `replace` tool will only be used for the most simple, single-line, unambiguous changes. For all other modifications, the full read-modify-write pattern will be used: `read_file` to get the exact content, perform changes in memory, and then `write_file` to overwrite the original. This will prevent `replace` tool failures and syntax errors.
*   **Thorough Pre-Coding Analysis:** Before writing any code, a more explicit and detailed analysis (Step 2 of the workflow) will be performed to check for existing imports, props, and component structure to avoid conflicts and ensure changes integrate seamlessly.
*   **Targeted Debugging with User Collaboration:** When a bug is not immediately apparent from static analysis, targeted logging will be added, and the user will be explicitly asked to provide the console output to pinpoint the exact cause.

### Session Summary (2025-09-13) [2]

This session was dedicated to a deep, end-to-end refactoring of the "Carousel Post" feature, followed by fixing several related UI bugs that were uncovered through rigorous testing and user feedback.

---

### 1. Summary of Accomplishments

*   **End-to-End Carousel Refactoring:** A complete overhaul of the carousel feature was performed across the entire stack.
    *   **Data Model:** The `MediaPlanPost` type in `types.ts` was updated to properly support carousels by adding an `imageKeys: string[]` field to correspond with the existing `imageUrlsArray: string[]`.
    *   **Backend (`api/mongodb.js`):** The `save-media-plan-group`, `update-media-plan-post`, and `load-media-plan` actions were all refactored to correctly persist and retrieve the new `imageKeys` and `imageUrlsArray` fields, ensuring data integrity for multi-image posts.
    *   **Frontend State & Services:** The `assetsReducer` and `databaseService` were updated to handle indexed array updates for carousels. The `useAssetManagement` hook was significantly refactored, making the `handleSetImage` function "carousel-aware" by allowing it to accept an index to update a specific slide.
    *   **UI Implementation:** The `PostCard` and `PostDetailModal` components were fixed to correctly render the `<Carousel />` component for posts with the `'Carousel'` content type.

*   **AI Response Normalization (Root Cause Fix):**
    *   **Problem:** It was discovered that the AI was returning a wide variety of `contentType` strings (e.g., `album`, `imageCarousel`, `reel`, `story`) that did not match the application's strict internal types.
    *   **Solution:** A `normalizeContentType` function was implemented in the `response.processor.ts` file. This function intercepts the AI response and maps all variations to the correct, standardized types (`'Carousel'`, `'Reel'`, etc.) before the data enters the main application state. This fixed numerous downstream UI bugs at their source.

*   **UI/UX Refinements:**
    *   **Prompt Display:** Fixed a bug where an array of `mediaPrompt` strings was being incorrectly displayed as a single, comma-separated line. The `ImagePostHandler` and `VideoPostHandler` were refactored to loop over the array and display each prompt individually.
    *   **Individual Prompt Copying:** As a follow-up, the UI was enhanced to wrap each individual prompt in the list with its own "copy-to-clipboard" feature.
    *   **Carousel Editor Redesign:** Based on user feedback and a provided diagram, the `CarouselPostHandler` was redesigned to feature a persistent "Paste Area" for each prompt, improving the workflow for updating individual carousel slides.

### 2. Issues to Note

*   **Critical Environment/Caching Issue:** The most significant issue during the session was the user's local environment not reflecting code changes. Multiple correct fixes were implemented but did not appear for the user, leading to repeated bug reports for already-fixed issues. This was diagnosed as a browser or development server caching problem that requires manual intervention from the user (a hard reload or server restart) to resolve. My initial diagnoses were incorrect, and I was not firm enough in insisting on this environmental fix.
*   **My Own Incomplete Analysis:** My initial fixes were not thorough enough. I failed to initially consider the full range of `contentType` values the AI could return, and I did not verify how every UI component would render an array of `mediaPrompt` strings. This led to a frustrating cycle of follow-up bugs that could have been prevented with a more holistic initial analysis.

### 3. Uncompleted Tasks

*   None. All technical tasks for this session were completed. The final remaining action is for the user to clear their environment's cache to see the latest correct version of the application.

### 4. Preventative Measures for Future Sessions

*   **Forceful Environment Check:** If a user reports that a fix is not working, and the evidence (e.g., screenshots) points to old code, I must immediately and firmly halt further code changes and insist on environment-clearing steps (hard reload, server restart). I should provide the user with a method to verify they have the new code (e.g., "look for this specific line of code in your browser's sources tab").
*   **Holistic Impact Analysis:** When a data structure from an external source (like an AI response) changes, I must perform a more rigorous analysis of the entire data flow to find and fix all downstream impacts in a single, comprehensive operation.
*   **Verify UI Rendering:** When fixing data logic, I must always follow up by manually tracing how that data is consumed and rendered by all relevant UI components.

## Session Summary (September 13, 2025) [3]

### Summary of Accomplishments

This session focused on fixing critical issues with carousel image generation and display:

1. **Fixed Carousel Image Generation Race Condition**:
   - Identified and resolved race conditions in concurrent carousel image generation
   - Modified the "Generate All" button to generate images sequentially instead of concurrently
   - Improved client-side state management to ensure proper data flow

2. **Fixed MongoDB Array Update Conflicts**:
   - Resolved MongoDB errors when updating carousel image arrays
   - Implemented individual array element updates instead of full array replacements
   - Eliminated conflicts between individual element and full array updates

3. **Enhanced Error Handling and Robustness**:
   - Added better error handling in asset management hooks
   - Improved state management to use current data instead of potentially stale data
   - Added comprehensive logging for debugging purposes

### Key Technical Changes

1. **PostDetailModal.tsx**:
   - Changed `handleGenerateAll` to generate images sequentially
   - Added proper useCallback import for React hooks

2. **useAssetManagement.ts**:
   - Improved carousel image update logic to use current state data
   - Added better error handling and logging
   - Enhanced state updates to prevent race conditions

3. **mongodb.js**:
   - Fixed MongoDB update operations to avoid field conflicts
   - Changed array updates to use individual element updates only
   - Removed conflicting full array updates

### Issues to Note

1. **UI Feed Refresh Issue**: While database updates are working correctly, the main post feed is not automatically refreshing to show newly generated images. This suggests the issue might be in how the application state is propagated to the feed components.

2. **Potential State Management Issues**: There might be additional state management issues in how the main application state is updated and propagated to all components after database updates.

### Uncompleted Tasks

1. **Post Feed Refresh**: The main task of ensuring the post feed refreshes with new images after generation is still incomplete. The database is correctly updated, but the UI feed is not reflecting these changes.

### Preventative Measures for Future Sessions

1. **Sequential Processing**: For operations that modify shared state, prefer sequential processing over concurrent operations to avoid race conditions.

2. **Database Update Patterns**: When updating arrays in MongoDB, use individual element updates rather than full array replacements to avoid conflicts.

3. **State Propagation**: Ensure that database updates properly propagate to all relevant UI components through proper state management patterns.

4. **Comprehensive Testing**: Always test both database updates and UI refreshes to ensure end-to-end functionality works correctly.

# Session Summary (2025-09-14) [1]

## 1. Summary of Accomplishments

This session focused on significantly enhancing the AI-Powered Trend Suggestion feature and standardizing the Content Strategy tab UI. Key accomplishments include:

### AI-Powered Trend Suggestion Enhancement
- **Enhanced Data Structure**: Added comprehensive search metadata fields to the `Trend` type including `searchVolume`, `competitionLevel`, `peakTimeFrame`, `geographicDistribution`, `relatedQueries`, `trendingScore`, `sourceUrls`, `category`, `sentiment`, and `predictedLifespan`.
- **Improved Prompt Builder**: Updated `SUGGEST_TRENDS_JSON_STRUCTURE` to request all enhanced metadata fields from the AI.
- **Database Persistence**: Modified MongoDB API to properly save and retrieve all enhanced trend metadata fields.
- **UI Enhancement**: Updated frontend to display comprehensive trend metadata with visual indicators.

### Content Strategy Tab Standardization
- **Complete Layout Restructuring**: Redesigned the entire Content Strategy tab with a clean, standardized layout featuring:
  - Left sidebar containing only the trends list (industry vs global indicators)
  - Main content area for trend details and metadata display
  - Top-positioned trend suggestion tools (Auto Suggest and Facebook Strategy sections)
- **Enhanced Trend List**: Added visual tags for industry vs global trends, search volume indicators, and competition level badges
- **Lean Trend Detail View**: Created organized display of all trend metadata with grid-based layout, progress bars for scores, and source link display
- **Mobile Optimization**: Implemented collapsible sidebar with overlay for mobile devices and proper responsive design

### Key Technical Improvements
- **Trend Auto-Replacement**: Modified trend suggestion logic to prepend new trends to the head of the existing list rather than replacing all trends
- **Enhanced UI Components**: Added comprehensive metadata display with proper visual hierarchy and source transparency
- **Type Safety**: Ensured all enhanced metadata fields are properly typed and handled throughout the application

## 2. Issues to Note

1. **Missing Language Translations**: Some new UI elements may be missing Vietnamese translations in the localization objects
2. **Incomplete Mobile Testing**: While the mobile layout has been significantly improved, thorough testing on various device sizes has not been completed
3. **Performance Considerations**: The enhanced trend detail view with multiple metadata sections may impact rendering performance with large trend lists

## 3. Uncompleted Tasks

1. **Comprehensive Mobile Testing**: While the mobile layout has been improved, testing across various device sizes and orientations is still needed
2. **Accessibility Audit**: A full accessibility audit of the new UI components has not been completed
3. **Performance Optimization**: Further optimization of the trend list rendering with virtualization may be needed for large datasets

## 4. Preventative Measures for Future Sessions

1. **Thorough Testing**: Always test both desktop and mobile layouts after major UI changes
2. **Type Consistency**: Ensure all new data fields are properly added to both frontend types and backend database schemas
3. **Localization Completeness**: Verify that all new UI elements include proper localization for both English and Vietnamese
4. **Progressive Enhancement**: When adding new features, ensure they enhance existing functionality rather than replacing it entirely
5. **Data Persistence Verification**: Always verify that new data fields are properly saved to and retrieved from the database
6. **Cross-Device Consistency**: Maintain consistent user experience and functionality across all device sizes after UI changes

## 5. Technical Debt Addressed

1. **Metadata Enrichment**: Previously sparse trend objects are now enriched with comprehensive search metadata
2. **UI Standardization**: Inconsistent layout has been replaced with a clean, standardized design
3. **Data Persistence**: Enhanced metadata fields are now properly persisted in the database
4. **User Experience**: Mobile experience has been significantly improved with proper sidebar management

# Session Summary (2025-09-14) [2]

## 1. Summary of Accomplishments

This session focused on implementing the Content Strategy tab redesign and fixing several critical bugs in the AI response processing system.

### Content Strategy Tab Redesign
- **Component Restructuring**: Refactored the monolithic StrategyDisplay component into a modern two-section layout:
  - `NavigationSidebar.tsx`: Collapsible sidebar containing trends list, search/filter functionality, and suggestion tools
  - `MainContentArea.tsx`: Main content area with tabbed interface for trend details
  - Child components: `TrendListItem.tsx`, `OverviewTab.tsx`, `RelatedQueriesTab.tsx`, `SourcesTab.tsx`
- **Performance Optimizations**: 
  - Implemented lazy loading for tab content using React.lazy/Suspense
  - Added memoization for frequently rendered components
  - Implemented input debouncing for search functionality (300ms delay)
- **UI/UX Improvements**: 
  - Created enhanced trend metadata display with visual indicators
  - Implemented stats dashboard with card-based layout
  - Made sidebar collapsible for focus mode
  - Added proper mobile responsiveness with overlay sidebar

### Bug Fixes
1. **Viral Ideas Generation**: Fixed the `processViralIdeasResponse` function to properly handle AI responses wrapped in markdown code blocks and extract the `ViralIdeas` array from the response object.

2. **Content Package Generation**: Fixed the `processContentPackageResponse` function to handle both `repurposedContent` (singular) and `repurposedContents` (plural) keys from AI responses, and made it more robust by logging warnings instead of throwing errors when repurposed content is missing.

3. **Prompt Builder Refactoring**: Refactored the prompt builder system to eliminate code duplication by creating dedicated helper functions for rule application:
   - `buildImagePromptRules()`, `buildCarouselPromptRules()`, `buildShortVideoScriptRules()`, etc.
   - Applied brand-specific image prompt rules (including the 8 key factors for realistic AI photos) to content package generation

4. **Brand Settings Integration**: Ensured that brand-specific settings rules are properly applied to all generated content, including:
   - Image prompt rules with 8 key factors for realistic AI photos
   - Short/long video script rules
   - Post caption rules

## 2. Issues to Note

1. **Potential UI Overflow**: The tabbed details section in the Content Strategy tab may still have scrolling issues on some screen sizes. Need to verify that all content fits properly within the viewport.

2. **Missing Error Handling**: The error handling in some components could be more robust, particularly for network failures and AI service timeouts.

3. **Incomplete Mobile Testing**: While mobile responsiveness was implemented, thorough testing across various device sizes and orientations has not been completed.

## 3. Uncompleted Tasks

1. **Comprehensive Mobile Testing**: While the mobile layout has been improved, testing across various device sizes and orientations is still needed.

2. **Accessibility Audit**: A full accessibility audit of the new UI components has not been completed.

3. **Performance Optimization**: Further optimization of the trend list rendering with virtualization may be needed for large datasets.

## 4. Preventative Measures for Future Sessions

1. **Follow Component Architecture**: Continue using the modular component structure with proper separation of concerns (NavigationSidebar + MainContentArea).

2. **Reuse Helper Functions**: Always use the dedicated helper functions for rule application in the prompt builder to avoid code duplication.

3. **Implement Performance Optimizations**: Continue using lazy loading, memoization, and debouncing for performance-critical components.

4. **Maintain Brand Settings Integration**: Ensure all AI-generated content properly applies brand-specific rules and settings.

5. **Thorough Testing**: Always test both desktop and mobile layouts after major UI changes.

6. **Type Safety**: Ensure all new data fields are properly added to both frontend types and backend database schemas.

7. **Progressive Enhancement**: When adding new features, ensure they enhance existing functionality rather than replacing it entirely.

8. **Data Persistence Verification**: Always verify that new data fields are properly saved to and retrieved from the database.

9. **Cross-Device Consistency**: Maintain consistent user experience and functionality across all device sizes after UI changes.

## 5. Technical Debt Addressed

1. **Code Duplication**: Eliminated repeated rule construction logic in the prompt builder by creating dedicated helper functions.

2. **Inconsistent Error Handling**: Made error handling more consistent across AI response processors.

3. **Missing Brand Settings Integration**: Ensured brand-specific rules are properly applied to all AI-generated content.

4. **UI Standardization**: Replaced inconsistent layout with a clean, standardized design following modern UI/UX principles.