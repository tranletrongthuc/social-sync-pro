# UI Improvement and Bug Fix Plan - 2025-09-29

## 1. Overview
This document outlines the tasks required to address critical UI/UX issues in the Persona Editor and the main application sidebars. The goal is to improve mobile usability and fix desktop layout regressions.

## 2. SMART Task Breakdown

### Task 1: Refactor Persona Editor Navigation for Mobile
*   **Specific:** In the "Chỉnh sửa Persona" (Edit Persona) modal, replace the current horizontal scrolling tab navigation with a space-saving dropdown menu (`<select>`) on mobile viewports (screens narrower than 768px). The existing vertical tab navigation on desktop should be preserved.
*   **Measurable:** On mobile, a single dropdown is visible, allowing users to switch between sections ('Identity', 'Voice', etc.). On desktop, the vertical list of tabs is visible. The functionality of switching between sections works perfectly on both platforms.
*   **Achievable:** This is a standard responsive design task, achievable by conditionally rendering the dropdown or the tab list based on screen size using CSS media queries or a breakpoint hook.
*   **Relevant:** Addresses the "broken" and poor UX of the horizontal scrolling tabs on small screens.
*   **Time-bound:** To be completed and submitted for review within one development day.

### Task 2: Add a "Close" Button to Mobile Sidebars
*   **Specific:** Add a visible "Close" button (e.g., an "X" icon) to the top-right corner of the slide-in sidebars used in the "Media Plan" and "Content Strategy" tabs. This button should only be visible on mobile viewports where the sidebar acts as an overlay.
*   **Measurable:** When the sidebar is opened on a mobile screen, a close button is present and clearly visible. Clicking this button closes the sidebar. The button is not visible on desktop.
*   **Achievable:** This involves adding a button to the shared sidebar component and wiring it to the existing `setIsSidebarOpen(false)` state management.
*   **Relevant:** Fixes a critical UX flaw where users are trapped in the full-screen mobile sidebar with no obvious way to exit.
*   **Time-bound:** To be completed and submitted for review within one development day.

### Task 3: Correct Desktop Sidebar Width
*   **Specific:** Ensure the sidebars in the "Media Plan" and "Content Strategy" tabs consistently occupy 50% of the screen width on desktop viewports (screens wider than 1024px).
*   **Measurable:** On any screen wider than 1024px, the sidebar's width is exactly 50% of the viewport. This can be verified using browser developer tools.
*   **Achievable:** This is a CSS regression fix, likely requiring a correction to a Tailwind CSS `md:w-1/2` class or an override that is incorrectly applying `w-full`.
*   **Relevant:** Fixes the major desktop layout bug where the sidebar consumes the entire screen.
*   **Time-bound:** To be completed and submitted for review within one development day.

### Task 4: Comprehensive Verification
*   **Specific:** After implementing all fixes, conduct a full regression test on both desktop and mobile (simulated) environments.
*   **Measurable:** A successful verification confirms:
    1.  **Persona Modal:** Dropdown works on mobile, tabs work on desktop.
    2.  **Sidebars:** "Close" button works on mobile, 50% width is correct on desktop.
    3.  No new bugs have been introduced.
*   **Achievable:** This is a mandatory quality assurance step.
*   **Relevant:** Ensures the fixes are complete and do not create new problems.
*   **Time-bound:** To be completed immediately following the implementation of the other tasks.
