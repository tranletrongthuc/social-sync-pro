# Feature: Advanced Settings Management

**Version:** 2.1
**Date:** 2025-09-06
**Status:** Implemented

---

## 1. Overview

This document describes the hierarchical settings system in SocialSync Pro. The system is designed to provide a powerful and flexible way to manage application configurations, allowing a global administrator to set default values while giving individual brands the autonomy to customize their own experience. This includes not only simple values like language and AI models, but also the complex, multi-line AI prompts that power all content generation features.

The core principle is **inheritance with overrides**. A brand inherits all its settings from a global default configuration. However, any setting a brand explicitly customizes is saved as a specific override, which will not be affected by future changes to the global defaults.

## 2. Key Concepts & Data Flow

The settings flow is designed to be intuitive and robust, ensuring consistency for new brands while providing flexibility for existing ones.

**1. Global Admin Configuration:**
-   **Source of Truth:** An administrator uses the **Admin Page** (`/admin`) to define the application's global default settings.
-   **Database:** These settings are stored as a single document in the `adminSettings` MongoDB collection. This includes default language, default AI models, visual style templates, and the master prompts for all AI features.
-   **AI Model Management:** The admin also manages a unified list of all available AI models in the `aiModels` collection. This list populates the dropdowns available to all users.

**2. Brand Initialization & Inheritance:**
-   **New Brands:** When a new brand is created, the backend automatically performs a one-time **copy** of the current global `adminSettings`. This copied set becomes the brand's own initial settings.
-   **Runtime Behavior:** When the application needs a setting for a brand, it reads the value from the brand's own saved `settings` object.

**3. Brand-Specific Customization:**
-   **The Settings Modal:** A user opens the `SettingsModal` to customize their brand's configuration.
-   **Loading Data:** The modal fetches two sets of data in a single, efficient API call (`load-settings-data`):
    1.  The brand's specific, currently saved `settings` object.
    2.  The complete global `adminSettings` object.
-   **Display Logic:** The modal displays the brand's specific setting. The `SettingField` and `PromptManager` components compare this to the global default to determine if the value is "Customized".
-   **Saving Changes:** When a user saves a change, that value is written to the brand's specific `settings` object in the `brands` collection, overwriting its previous value.

**4. The "Opt-In" Update Flow:**
-   **Impact of Admin Changes:** When an admin updates a global default (e.g., changes the recommended `imageGenerationModel`), existing brands are **not** affected because they have their own copy of the settings.
-   **Dynamic Dropdowns:** However, the *new* global default value immediately becomes visible inside the `SettingsModal` for all brands. The `SettingField` component will show a "Default" option in the dropdown reflecting the new global value.
-   **User Action:** This allows a user to see that a new global default is available and consciously "opt-in" to it by selecting it from the dropdown, which then saves it as their new brand-specific setting.

---

## 3. Technical Implementation Details

### 3.1. Database Schema (MongoDB)

-   `adminSettings` **(Collection):** A single-document collection storing the global default `Settings` object. This object now includes a nested `prompts` object.
-   `aiModels` **(Collection):** A unified collection of all available AI models. Each document contains the model name, provider, capabilities, and the service it belongs to (e.g., "Google", "Cloudflare"). This replaced the previous, less efficient two-collection schema (`aiServices` and `aiModels`).
-   `brands` **(Collection):** Each brand document contains an embedded `settings: {}` object. This object stores the brand's complete set of settings, initially copied from the global defaults.

### 3.2. Backend API (`api/mongodb.js`)

-   `create-or-update-brand`: When this action is called for a new brand (i.e., no `brandId` is provided), the backend now automatically fetches the document from `adminSettings` and saves it as the initial `settings` object for the new brand.
-   `load-settings-data`: A consolidated action that efficiently fetches both the `adminSettings` and the full list of `aiModels` in parallel for populating the settings modal.
-   `save-admin-defaults`: The action used by the Admin Page to update the global `adminSettings` document. It now performs a deep merge with the hardcoded `defaultPrompts` to ensure no prompt fields are ever missing.
-   `save-settings`: The action used to save a brand's custom overrides into the `settings` object within that brand's document.

### 3.3. Frontend Components

-   `App.tsx`: The main component orchestrates the settings logic. It loads the brand-specific settings into its state and passes them to the modal. The logic has been corrected to ensure brand settings are correctly loaded and not overwritten by global settings.
-   `SettingsModal.tsx`: The primary UI for settings. It dynamically fetches all required data when opened and uses the `SettingField` component to render each setting. It now includes a "Prompts" tab that renders the `PromptManager`.
-   `SettingField.tsx`: A reusable component that:
    -   Displays the brand's current setting value.
    -   Shows a "Customized" badge if the brand's value differs from the global default.
    -   Dynamically populates dropdowns with available options, including an option to select the current global "Default" value.
-   `AdminPage.tsx`: The UI for managing global `adminSettings` and the unified `aiModels` list. It now includes a "Prompt Management" tab that renders the `PromptManager`.
-   `PromptManager.tsx`: A new component that provides a dedicated UI for editing the complex, multi-line AI prompts. It allows for direct comparison between the brand's custom prompt and the global admin default.

---

## 4. Summary of Refactoring Journey

The current advanced settings system was achieved through several key refactoring steps:

1.  **API Consolidation:** The initial, inefficient `load-ai-services` endpoint was replaced with the comprehensive `load-settings-data` endpoint to improve performance.
2.  **Database Migration:** The database schema was simplified by merging the `aiServices` and `aiModels` collections into a single, more maintainable `aiModels` collection. A migration script (`scripts/migrate-ai-models.js`) was created and executed to handle this data transition.
3.  **Prompt Externalization:** All hardcoded AI prompts were removed from the service layer and centralized into a `prompts` object within the `Settings` type, with default values established in `api/lib/defaultPrompts.js`.
4.  **Bug Fixes & Logic Correction:**
    -   A critical bug was resolved where the `SettingsModal` would incorrectly display global settings instead of brand-specific settings. This was fixed by correcting the data flow logic in `App.tsx`.
    -   The brand creation logic was corrected in the backend to ensure that every new brand receives a copy of the current global settings upon creation, fulfilling the specified requirement.

---

## 5. Feature: Dynamic Prompt Management

A major enhancement to the settings system is the ability to configure, override, and manage every AI prompt used in the application. This moves the core "secret sauce" of the AI's behavior from hardcoded strings into a manageable, user-facing feature.

### 5.1. Data Model & Defaults

-   **`types.ts`:** The main `Settings` interface was updated to include a new `prompts` property. This is a large, nested object containing every prompt template used by the application, from generating a brand kit to refining a single post.
-   **`api/lib/defaultPrompts.js`:** A new file was created to act as the ultimate source of truth for the default prompt structures. This file exports a complete `prompts` object.
-   **Backend Merging:** When the administrator saves their global settings, the backend performs a **deep merge** of their saved settings against this `defaultPrompts.js` file. This ensures that even if new prompts are added to the codebase in the future, the `adminSettings` document in the database will always be complete and never have missing fields.

### 5.2. Backend AI Service Refactoring

-   All AI service functions in `api/gemini.js` (e.g., `auto-generate-persona`, `generate-in-character-post`) were refactored.
-   They no longer contain hardcoded prompt templates. Instead, they receive the `settings` object in the request body and dynamically construct the final prompt using the templates from `settings.prompts`.

### 5.3. Frontend Implementation

-   **Service Layer (`geminiService.ts`, `textGenerationService.ts`):** All functions that initiate an AI generation task were refactored. Their signatures were updated to accept the `settings: Settings` object, which is then passed down through the `bffService` to the backend.
-   **`PromptManager.tsx` Component:** A new, sophisticated component was created to handle the complexity of editing large text areas. It provides a tabbed interface to navigate the nested `prompts` object and shows a side-by-side comparison of the brand's custom prompt against the inherited global default, allowing for easy reference and reversion.
-   **UI Integration:** The `PromptManager` is rendered in two places:
    1.  **`AdminPage.tsx`:** Under a "Prompt Management" tab, allowing the administrator to edit the global default prompts for all users.
    2.  **`SettingsModal.tsx`:** Under a "Prompts" tab, allowing an individual brand to view the global defaults and create their own specific overrides.
