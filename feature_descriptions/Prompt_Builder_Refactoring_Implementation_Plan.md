# Technical Implementation Plan: Prompt Builder Refactoring

**Version:** 3.0
**Date:** 2025-09-11
**Status:** Proposed

---

## 1. Objective

This document provides a detailed, step-by-step technical plan to refactor the prompt generation system based on the approved **Solution Plan (v3.0)**. The goal is to implement a two-tiered settings hierarchy and a modular, component-based prompt builder.

## 2. Phased Implementation Strategy

The refactoring will be executed in focused phases to ensure a controlled and verifiable transition.

---

### **Phase 1: Update Backend & Data Models**

**Objective:** Modify the database logic and data types to support the new two-tiered settings model.

**Tasks:**

1.  **Modify Backend Brand Creation Logic:**
    *   **File:** `api/mongodb.js`
    *   **Action:** In the `create-or-update-brand` action, **remove the logic that copies `adminSettings`** when a new brand is created.
    *   **New Logic:** When a new brand is created, its `settings` object should be initialized with a minimal structure containing only the fields a user can customize. For example:
        ```javascript
        const brandSettings = {
            prompts: {
                rules: {
                    imagePrompt: [],
                    postCaption: [],
                    shortVideoScript: [],
                    longVideoScript: []
                }
            }
        };
        // ... save this minimal object to the new brand's settings field.
        ```

2.  **Update `types.ts` for Configurable Rules:**
    *   **Action:** Modify the `Prompts` interface to reflect the new structure. The main templates will no longer be part of the brand-level `Settings` type.
    *   **New Structure Example:**
        ```typescript
        // In the brand-specific Settings object
        export type Prompts = {
            rules?: {
                imagePrompt?: string[];
                postCaption?: string[];
                shortVideoScript?: string[];
                longVideoScript?: string[];
            }
        }
        ```

---

### **Phase 2: Establish the Core Toolkit**

**Objective:** Create the foundational classes and reusable component builders.

**Tasks:**

1.  **Create `PromptBuilder` Class:**
    *   **File:** `src/services/prompt.builder.ts` (This file will be overwritten).
    *   **Action:** Create a new `PromptBuilder` class with a `build()` method and chainable methods for adding components.

2.  **Create Component Builders:**
    *   **File:** `src/services/prompt.builder.ts`
    *   **Action:** Create the set of reusable functions. These functions will now often require both `adminSettings` and brand-specific `settings`.
    *   **Example Function Signature:** `buildPostCaptionComponent(body: string, brandSettings: Settings, adminSettings: Settings): string`
        *   This function would get the main template from `adminSettings.prompts.simple.generateCaption` and apply the rules from `brandSettings.prompts.rules.postCaption`.

---

### **Phase 3: Refactor Settings UI & Data Flow**

**Objective:** Update the UI to match the new, simplified settings hierarchy.

**Tasks:**

1.  **Simplify User `SettingsModal`:**
    *   **File:** `src/components/SettingsModal.tsx`
    *   **Action:** Remove the "Prompts" tab that shows the `PromptManager` for regular users.
    *   **New UI:** Add a new section or tab named "Prompt Rules" or "AI Style Guide". This section will contain simple text fields or tag inputs for users to edit the values for `imagePromptRules`, `postCaptionRules`, etc.

2.  **Isolate `PromptManager` to Admin Page:**
    *   **File:** `src/components/AdminPage.tsx`
    *   **Action:** Confirm that the `PromptManager` component is only used here, allowing Admins to edit the global prompt templates stored in `adminSettings`.

3.  **Update Data Fetching:**
    *   **File:** `src/App.tsx` (and relevant hooks)
    *   **Action:** Ensure that when preparing for a generation task, the application fetches both the global `adminSettings` and the current brand's specific `settings` so both can be passed to the prompt builder.

---

### **Phase 4: Incremental Refactoring of Features**

**Objective:** Apply the new builder pattern to all content generation features.

**Tasks:**

1.  **For each feature (`generateBrandKit`, `generateMediaPlanGroup`, etc.):**
    *   **Refactor Orchestrator:** In `textGenerationService.ts`, rewrite the feature's function.
    *   **New Logic:** The function will now instantiate the `PromptBuilder` and use the new component functions, passing both the admin and brand settings to them as needed.
        ```typescript
        // Example for a simple post generation
        const prompt = new PromptBuilder()
            .addInstruction(adminSettings.prompts.simple.postSystemInstruction) // From Admin
            .addPostCaption(params.topic, params.brandSettings) // Uses brand-specific rules
            .addJsonOutput("Social Media Post", { caption: "string" }) // Hardcoded
            .build();
        ```
    *   **Cleanup:** Delete any old, monolithic prompt-building logic.

---

## 5. Verification

After each phase, the following verification steps are mandatory:

1.  **Compile:** Run `npx tsc --noEmit` to ensure no type errors have been introduced.
2.  **Test:** Manually execute the refactored feature in the application to confirm that it functions correctly, using data from both settings sources as expected.
