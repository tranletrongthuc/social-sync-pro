**Objective:** Refactor the data fetching logic in our React application to improve initial load times and resource management. We will move from the current "eager loading" pattern to a strategic "lazy loading" and "on-demand" fetching architecture.

**Technical Context:**
* **Frontend:** React (with TypeScript), Vite. We use a central service (`bffService.ts`) to handle all API calls. State management is handled by React's context or a similar library.
* **Backend:** A Backend-for-Frontend (BFF) architecture running on Vercel Serverless Functions (Node.js).
* **Database:** We are migrating from Airtable to MongoDB. The new API endpoints should be designed with MongoDB's performance capabilities in mind, especially for pagination.
* **Core Data Tabs/Components:** `BrandKitView`, `MediaPlanView`, `StrategyHubView`, `AffiliateVaultView`, `PersonasView`.

**Current Problem:**
When a user loads a project (`Brand`), the application currently fetches almost all data for every tab at once, causing significant initial load delays and wasting resources.

**Detailed Implementation Plan:**

Please provide the necessary code modifications to implement the following 3-step optimization strategy:

**Step 1: Implement a Focused Initial Project Load**

The goal is to make the initial project loading feel instantaneous by only fetching the absolute necessary data and directing the user to the first available view.

1.  **Backend (BFF):**
    * Create a new, dedicated endpoint: `GET /api/brands/:id/initial-load`.
    * This endpoint should perform an optimized database query to return a JSON object containing:
        * Basic summary data for the brand (e.g., `{ id, name, logoUrl }`).
        * The **full dataset** required for the `BrandKitView` tab (e.g., `{ brandProfile, logoConcepts, colorPalettes }`).

2.  **Frontend:**
    * Refactor the function responsible for loading a project. It should now call the new `GET /api/brands/:id/initial-load` endpoint instead of the old, heavy one.
    * Upon receiving a successful response, the app must **programmatically redirect** the user to the `/brand-kit` route.
    * The `BrandKitView` component should now render instantly without a loading state, as its data is already present.

**Step 2: Implement On-Demand (Lazy) Loading for Other Tabs**

Data for all other tabs should only be fetched when the user navigates to them for the first time in a session.

1.  **Backend (BFF):**
    * Ensure there are separate endpoints to fetch the data for each specific tab. For example:
        * `GET /api/brands/:id/media-plans-list` (Note: This should only return the list of plans, not the posts inside them).
        * `GET /api/brands/:id/strategy-hub`
        * `GET /api/brands/:id/affiliate-vault`
        * `GET /api/brands/:id/personas`

2.  **Frontend:**
    * For each tab component (e.g., `StrategyHubView`, `PersonasView`, etc.), implement a data-fetching hook (e.g., using `useEffect` or `react-query`).
    * This hook should check if the data for its tab already exists in the application's state.
    * If the data does *not* exist, it should display a loading indicator and trigger the corresponding API call to fetch it.
    * Once fetched, the data should be cached in the client-side state to prevent re-fetching during the same session.

**Step 3: Implement Pagination for the Media Plan's Post List**

The `MediaPlanView` is expected to handle the largest amount of data (potentially thousands of posts). It must be optimized with pagination.

1.  **Backend (BFF):**
    * Modify the endpoint for fetching posts to support pagination. For example: `GET /api/media-plans/:planId/posts`.
    * This endpoint must accept query parameters like `?page=1&limit=30`.
    * The backend logic should use these parameters to perform an efficient, paginated query in MongoDB.

2.  **Frontend:**
    * In the `MediaPlanView` component, when a user selects a media plan, fetch only the *first page* of posts.
    * Implement an "infinite scroll" feature. As the user scrolls towards the bottom of the post list, the component should automatically request the next page of data and append it to the existing list.

Please provide the necessary code snippets and modifications for the frontend components and the BFF serverless functions to achieve this refactoring.