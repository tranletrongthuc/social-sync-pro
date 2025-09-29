# Desktop UI Regression Fix Plan - 2025-09-29

## 1. Overview

A recent implementation of mobile usability enhancements has introduced critical regressions in the desktop user interface. This plan outlines the specific tasks required to fix these issues, restore desktop functionality, and ensure no new regressions are introduced. The core principle is to isolate desktop-specific styles from mobile styles.

## 2. SMART Task Breakdown

### Task 1: Restore Desktop Persona Editor Modal Functionality

*   **Specific:** Restore the "Chỉnh sửa Persona" (Edit Persona) modal to its original, functional state on desktop viewports (screens wider than 1024px). The modal's layout should be responsive and correctly sized, displaying all content and interactive elements properly.
*   **Measurable:** On screens wider than 1024px, the modal opens and operates without any layout breaks or overflow. All buttons and form fields are fully visible and usable. The existing mobile view remains unchanged.
*   **Achievable:** This is a regression fix, achievable by isolating and correcting the responsible CSS or component logic.
*   **Relevant:** This directly addresses the critical bug where the persona editor is unusable for desktop users.
*   **Time-bound:** To be completed and submitted for review within one development day.

### Task 2: Repair Desktop Media Plan Content Feed Layout

*   **Specific:** Fix the "Content Feed" layout within the Media Plan tab for desktop viewports (screens wider than 1024px). The feed must correctly display the grid of post cards as it did prior to the regression.
*   **Measurable:** On screens wider than 1024px, the content feed renders all post cards in the correct grid structure without any overlapping elements or layout corruption. The mobile view remains unaffected.
*   **Achievable:** This is a regression fix, likely requiring adjustments to the grid or container styles for desktop breakpoints.
*   **Relevant:** This fixes a core feature visibility bug for desktop users.
*   **Time-bound:** To be completed and submitted for review within one development day.

### Task 3: Correct Desktop Sidebar Width

*   **Specific:** Adjust the styling for the main application's left-hand sidebar. On desktop viewports (screens wider than 1024px), its width must be set to 50% of the screen. On smaller screens, it must retain its current mobile-optimized behavior (e.g., collapsed overlay).
*   **Measurable:** On any screen wider than 1024px, the sidebar's width is exactly 50% of the viewport, with the main content area occupying the other 50%. The mobile/tablet view is verified to be unchanged.
*   **Achievable:** This is a straightforward CSS adjustment using media queries.
*   **Relevant:** This addresses the major layout issue where the sidebar consumes the entire screen on desktop.
*   **Time-bound:** To be completed and submitted for review within one development day.

### Task 4: Comprehensive Verification and Regression Testing

*   **Specific:** After implementing all fixes, conduct a full regression test. Create a short screen recording demonstrating that all fixes work correctly on desktop and have not negatively impacted the mobile experience.
*   **Measurable:** A successful verification includes:
    1.  Desktop: Persona modal, media feed, and 50% sidebar width are all confirmed fixed.
    2.  Mobile: Persona modal, media feed, and sidebar behavior are all confirmed to be unchanged.
    3.  No new bugs are observed in other parts of the application on either platform.
*   **Achievable:** This is a mandatory quality assurance step.
*   **Relevant:** Ensures the fixes are complete and do not create new problems, preventing a repeat of the current situation.
*   **Time-bound:** To be completed immediately following the implementation of the other tasks.
