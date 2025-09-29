# UI Regression Fix and Standardization Plan

## 1. Specification

*   **Describe what & why:** The primary goal is to fix the severe UI regressions on the desktop platform, which is the main user environment. This includes a broken Persona Editor modal, a malfunctioning Media Plan content feed, and an incorrect sidebar width. Secondly, I will standardize the inconsistent UI elements on mobile, such as button sizes and padding, to ensure a professional and cohesive user experience. These fixes are critical to restore core application functionality and maintain UI integrity.
*   **Difficulty Ranking:** **A**. This task involves multiple components and requires precise changes to responsive styles. The risk of introducing further regressions is high if not handled with extreme care.

## 2. Step-by-Step Technical Plan

*   **Objective:** Restore all desktop functionality to its correct state and enforce UI consistency across mobile components.
*   **Context:** The project utilizes React, TypeScript, and Tailwind CSS. The fixes will involve correcting the application of responsive utility classes (e.g., `md:`, `lg:`) within the `.tsx` component files to ensure styles are applied to the appropriate breakpoints.
*   **Constraints:**
    *   Zero new regressions will be introduced.
    *   All changes must align with the newly established design system (`src/design/*`).
    *   Desktop functionality is the priority; mobile styles must not break the desktop layout.
*   **Desired Output Format:** A series of precise file modifications. I will verify all changes with `npm run build` and `npx tsc --noEmit` to ensure build integrity and type safety.

## 3. Tasks

### PHASE 1: Create Planning Document
*   **Task 1.1:** Save the specification and technical plan to a formal document in the workspace.

### PHASE 2: Fix Critical Desktop Regressions
*   **Task 2.1:** **Fix Desktop Sidebar Width:** I will investigate `StandardPageView.tsx` and `MainDisplay.tsx` to correct the sidebar width on desktop, ensuring it adheres to the intended 50% width (`md:w-1/2`).
*   **Task 2.2:** **Fix Persona Editor Modal:** I will analyze `PersonaEditorModal.tsx` and correct its responsive classes to ensure it is no longer broken on desktop.
*   **Task 2.3:** **Fix Media Plan Content Feed:** I will inspect the layout classes in `MediaPlanDisplay.tsx` to repair the broken content feed on desktop.

### PHASE 3: Fix Mobile UI Inconsistencies
*   **Task 3.1:** **Standardize Mobile Button Sizes:** I will read `MediaPlanDisplay.tsx` and `ContentStrategyPage.tsx` to identify and unify the styling of their action buttons for a consistent mobile experience.
*   **Task 3.2:** **Address General Styling Inconsistencies:** While addressing the primary issues, I will correct any other obvious deviations in padding, margins, and typography in the affected components.
