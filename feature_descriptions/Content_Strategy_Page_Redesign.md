Of course. Here is the comprehensive document, merging both the UI/UX redesign description and the technical requirements into a single specification for your frontend team.

-----

### **Comprehensive Frontend Specification: Content Strategy Page Redesign**

**Project:** SocialSync Pro
**Feature:** Content Strategy Page
**Tech Stack:** TypeScript, Vite

-----

### **1.0 Objective**

This document outlines the complete redesign of the "Content Strategy" page. The goal is to create a user interface that is not only visually modern and intuitive but also highly performant, scalable, and maintainable. This specification covers both the UI/UX design and the underlying technical implementation requirements.

-----

### **2.0 UI/UX Redesign Specification**

We will transition from the current three-column layout to a more focused and efficient two-section layout.

#### **2.1. Overall Layout**

  * **Layout Structure:** A two-section design featuring a **Navigation Sidebar** on the left (30% width) and a **Main Content Area** on the right (70% width).
  * **Action Column Removal:** The third column dedicated to actions is eliminated. Primary actions will be moved directly into the Main Content Area for better context.
  * **Collapsible Sidebar:** The Navigation Sidebar must be collapsible, allowing users to enter a "focus mode" that maximizes the space for content analysis.

#### **2.2. Navigation Sidebar (Left Section)**

This section is for browsing, searching, and managing content trends.

  * **Search/Filter Bar:** A search input at the top for real-time filtering of the saved trends list by keyword.
  * **Suggestion Sections:** Sections like "AI-powered trend suggestions" will be implemented as **collapsible accordions** to maintain a clean interface.
  * **Saved Trends List:**
      * **Content:** Each list item will display the trend's **Title**, its **Industry Tag**, and one or two **key metrics** (e.g., "Vol: 75") for quick scanning.
      * **Active State:** The currently selected item must be visually distinct (e.g., different background color or a vertical accent bar) to indicate what is being displayed in the Main Content Area.
      * **Functionality:** Clicking an item loads its full details into the Main Content Area.

#### **2.3. Main Content Area (Right Section)**

This is the primary workspace for viewing details and taking action.

  * **2.3.1. Content Header**

      * **Title:** A large, bold title (e.g., `Idea for: Techniques for restoring and preserving old books`).
      * **Tag:** An "Industry Tag" displayed next to the title as a styled pill/tag.
      * **Primary Actions:** The main "Generate Idea" button will be prominently placed in the top-right corner. It will be accompanied by smaller icons for secondary actions like "Edit" and "Delete".

  * **2.3.2. Stats Dashboard**

      * **Format:** Key metrics will be displayed as a horizontal row of **Cards** instead of a vertical list. This improves scannability.
      * **Card Content:** Each card must contain a relevant **Icon**, the **Metric Name**, and its **Value**.
      * **Color Coding:** Use colors to provide instant visual feedback (e.g., Sentiment: `Positive` in green; Competition: `Medium` in orange).

  * **2.3.3. Tabbed Details Section**

      * **Structure:** To avoid a long scroll, detailed information will be organized into tabs.
      * **Tabs:**
        1.  **Overview (Default):** Contains the main description paragraph.
        2.  **Related Queries:** Lists related search terms.
        3.  **Sources:** Lists clickable source URLs.

-----

### **3.0 Technical & Performance Requirements**

To ensure the implementation is fast, efficient, and maintainable, the following technical standards must be met.

#### **3.1. Component & Code Structure**

  * **Component-Based Architecture:** The design must be broken down into small, reusable components as outlined below:
      * `ContentStrategyPage.tsx`
          * `NavigationSidebar.tsx` -\> `SearchFilter.tsx`, `TrendListItem.tsx`
          * `MainContentArea.tsx` -\> `ContentHeader.tsx`, `StatsDashboard.tsx` -\> `StatCard.tsx`, `TabbedDetails.tsx`
  * **Styling:** Use a scoped styling solution like **CSS Modules** or a CSS-in-JS library to prevent global style conflicts. Tailwind CSS is also a recommended option.
  * **Code Quality:** Enforce a consistent code style using **ESLint** and **Prettier**. These should be integrated into the development and CI/CD workflow.

#### **3.2. Loading Speed Optimization**

  * **Code Splitting:**
      * **Lazy Load Components:** Use dynamic `import()` for large components. The content for the **"Related Queries"** and **"Sources"** tabs should only be loaded when the user clicks on them.
        ```typescript
        // Example with React
        const RelatedQueriesTab = React.lazy(() => import('./RelatedQueriesTab'));

        <Suspense fallback={<div>Loading...</div>}>
          {activeTab === 'queries' && <RelatedQueriesTab />}
        </Suspense>
        ```
  * **Asset Optimization:**
      * **Images:** Use modern image formats like **WebP**.
      * **Icons:** Use **SVG** icons (imported as components) for sharpness and small file size.
  * **List Virtualization:** If the "Saved Trends List" can become long, it **must** be implemented using a virtualization library (e.g., **`TanStack Virtual`**, **`react-window`**). This ensures high performance by only rendering items visible in the viewport.

#### **3.3. Runtime Performance Optimization**

  * **Efficient State Management:** Use a modern, lightweight state management library like **Zustand** or **Jotai** to prevent unnecessary re-renders. For local state, use React hooks like `useReducer` for complex state logic.
  * **Memoization:** Apply `React.memo` to components that receive the same props frequently (e.g., `TrendListItem`, `StatCard`). Use `useMemo` and `useCallback` hooks to prevent expensive recalculations and function re-creations.
  * **Input Debouncing:** The search input in the sidebar **must** use a debouncing mechanism to prevent firing search queries on every keystroke, reducing network requests and computational load.

#### **3.4. Effective TypeScript Usage**

  * **Clear Type & Interface Definitions:** All data structures, especially API responses and component props, must be strongly typed. Create a central `types/` directory for these definitions.
    ```typescript
    // Example: src/types/trends.ts
    export interface Trend {
      id: string;
      title: string;
      industry: string;
      searchVolume: number;
      trendingScore: number;
    }

    export interface TrendDetails extends Trend {
      sentiment: 'Positive' | 'Neutral' | 'Negative';
      // ... other detailed fields
    }
    ```

-----

### **4.0 Summary of Benefits**

This integrated approach will result in a feature that is:

  * **Focused & Clean:** An uncluttered UI that improves user workflow.
  * **Visually Insightful:** Better data visualization through the stats dashboard.
  * **Blazing Fast:** Optimized for initial load and smooth runtime interaction.
  * **Maintainable:** A clean, component-based codebase that is easy to scale.