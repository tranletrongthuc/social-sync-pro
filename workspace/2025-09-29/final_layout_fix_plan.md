# Final Plan to Fix Media Plan UI Regressions

## 1. Overview

Previous attempts to fix the `MediaPlanDisplay` layout have failed. This document provides a new, definitive plan that MUST be followed precisely. We will replace the unpredictable Flexbox layout with a rigid CSS Grid system to guarantee a 50/50 split on desktop and explicitly remove the stray UI element.

## 2. Task 1: Remove Stray Checkbox Element

*   **Specific:** Open the file `src/components/media-plan/MediaPlanSidebar.tsx`. Search for an `<input type="checkbox">` element that does not have a clear purpose or label, likely near the top of the component. It may be conditionally rendered. Find and **delete this element and any surrounding container** that exists only to hold it.
*   **Measurable:** The checkbox in the top-left corner of the screen is completely gone.
*   **Achievable:** This is a simple search-and-delete operation.
*   **Relevant:** Fixes issue #3 from the screenshot.
*   **Time-bound:** To be completed in under 15 minutes.

## 3. Task 2: Enforce a Strict 50/50 Desktop Grid Layout

This task will override the existing layout with a predictable CSS Grid.

### Step 2.1: Modify the Main Container in `MediaPlanDisplay.tsx`

*   **Specific:** Open `src/components/MediaPlanDisplay.tsx`. Locate the `div` that wraps both the `<MediaPlanSidebar>` and the main content area. This `div` currently has `className="h-full flex flex-col md:flex-row bg-gray-50/50"`.
*   **Action:** **Replace** the existing layout classes. The new classes must be:
    ```jsx
    <div className="h-full grid grid-cols-1 md:grid-cols-2 md:gap-6">
    ```
    This explicitly creates a single column layout for mobile and a two-column grid with a gap for desktop.

### Step 2.2: Strip Width Classes from Sidebar and Main Content

*   **Specific:** To allow the new grid container to control the layout, we must remove conflicting width styles from its children.
*   **Action 1 (Sidebar):** Open `src/components/media-plan/MediaPlanSidebar.tsx`. Find the root `<aside>` element. **Remove any and all width-related Tailwind classes** from it, such as `w-full`, `md:w-1/2`, or `w-80`. The grid will now manage its width. Let its other classes for background, border, etc., remain.
*   **Action 2 (Main Content):** Go back to `src/components/MediaPlanDisplay.tsx`. Find the `div` that wraps `<MediaPlanMainContent />`. **Remove any and all width or flex-related classes** from it, such as `flex-1`. The grid will also manage its width.

*   **Measurable:** On screens wider than the `md` breakpoint (768px), the sidebar and main content each occupy exactly one of the two grid columns, creating a perfect 50/50 split (minus the gap).
*   **Relevant:** Fixes issues #1 and #2 from the screenshot.
*   **Time-bound:** To be completed within 1 hour.

## 4. Task 3: Comprehensive Verification

*   **Specific:** After applying all changes, you must verify that the fixes work and have not introduced any new bugs.
*   **Verification Steps:**
    1.  **Desktop View:** Confirm the stray checkbox is gone and the Media Plan layout is a strict 50/50 split.
    2.  **Mobile View:** Confirm the layout stacks into a single, usable column. Critically, test the mobile sidebar functionality: click the menu icon to open the sidebar as a full-screen overlay and ensure the close button works.
    3.  **Build & Type Check:** Run `npm run build` and `npx tsc --noEmit` to ensure no build-time or type errors were introduced.

This plan is not a suggestion. It is a direct instruction to use a specific CSS technique to resolve a persistent bug. Implement it exactly as described.
