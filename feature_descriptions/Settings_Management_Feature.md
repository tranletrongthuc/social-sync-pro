# Feature: Advanced Settings Management

**Version:** 2.2
**Date:** 2025-09-12
**Status:** Implemented

---

## 1. Overview

This document describes the hierarchical settings system in SocialSync Pro. The system is designed to provide a powerful and flexible way to manage application configurations, allowing a global administrator to set default values while giving individual brands the autonomy to customize their own experience. This includes not only simple values like language and AI models, but also the complex, multi-line AI prompts that power all content generation features.

The core principle is a **two-tiered, non-duplicative architecture**: a global set of default templates and a brand-specific set of overrides. A brand's settings only store what is different from the global defaults, ensuring a clean, efficient, and maintainable system.

## 2. Key Concepts & Data Flow

The settings flow is designed to be robust and prevent data duplication.

**1. Global Admin Configuration:**
-   **Source of Truth:** An administrator uses the **Admin Page** (`/admin`) to define the application's global default settings.
-   **Database:** These settings are stored as a single document in the `adminSettings` MongoDB collection. This includes default language, default AI models, and the master **prompt templates** for all AI features.
-   **AI Model Management:** The admin also manages a unified list of all available AI models in the `aiModels` collection. This list populates the dropdowns available to all users.

**2. Brand Initialization & Overrides:**
-   **New Brands:** When a new brand is created, it does **not** copy the admin settings. Instead, the backend creates a new, minimal `settings` object for the brand. This object is initialized with only a `prompts.rules` structure, ready for customization.
-   **Runtime Behavior:** When the application needs settings for a brand, the client-side fetches **both** the global `adminSettings` and the brand's specific `settings` (which only contains overrides). These two objects are **merged in memory** on the client to produce the final, complete settings object used by the UI and generation services.

**3. Brand-Specific Customization:**
-   **The Settings Modal:** A user opens the `SettingsModal` to customize their brand's configuration.
-   **Display Logic:** The modal's UI components (like `SettingField` and `PromptManager`) receive the merged settings object. They compare the brand's specific value against the global default value to determine if a setting has been "Customized".
-   **Saving Changes:** When a user saves a change, the client sends the full, merged settings object to the backend. The backend `save-settings` API then intelligently **"slims down"** this object, saving only the allowed overrides (like `language` or `prompts.rules`) to the brand's specific `settings` document. The prompt templates are always discarded and never saved at the brand level.

**4. The "Opt-In" Update Flow:**
-   **Impact of Admin Changes:** When an admin updates a global default (e.g., changes the recommended `imageGenerationModel`), this change is immediately available to all brands at runtime because they fetch the admin settings directly.
-   **User Experience:** If a brand has not customized that specific setting, it will automatically start using the new global default. If they *have* customized it, their override remains in place, but they can see the new global default in the `SettingsModal` and choose to adopt it.

---

## 3. Technical Implementation Details

### 3.1. Database Schema (MongoDB)

-   `adminSettings` **(Collection):** A single-document collection storing the global default `Settings` object, including the full `prompts` object with all templates.
-   `aiModels` **(Collection):** A unified collection of all available AI models.
-   `brands` **(Collection):** Each brand document contains an embedded `settings: {}` object. This object **only stores overrides**. For a new brand, it will only contain `{ prompts: { rules: { ... } } }`. Other fields are added only when the user customizes them.

### 3.2. Backend API (`api/mongodb.js`)

-   `create-or-update-brand`: When this action is called for a new brand, the backend creates a minimal `settings` object containing only an empty `prompts.rules` structure. It **does not** copy from `adminSettings`.
-   `save-settings`: This action has been refactored. It now accepts the full settings object from the client, but creates a `slimSettings` object containing only the fields a brand is allowed to override. It explicitly saves only the `prompts.rules` object and discards all other prompt templates before updating the database. This enforces the architectural separation.
-   `load-settings-data`: A consolidated action that efficiently fetches both the `adminSettings` and the full list of `aiModels`.
-   `save-admin-defaults`: The action used by the Admin Page to update the global `adminSettings` document.

### 3.3. Frontend Components

-   `App.tsx`: The main component orchestrates the settings logic. It fetches both `adminSettings` and the specific brand's `settings` and holds them in state. It is responsible for passing the merged settings object to child components.
-   `SettingsModal.tsx`: The primary UI for settings. It receives both the brand's settings and the admin settings to allow for comparison and customization.
-   `SettingField.tsx`: A reusable component that displays the brand's current setting value and compares it against the admin default to show a "Customized" badge or allow opting-in to the default.
-   `AdminPage.tsx`: The UI for managing global `adminSettings`.
-   `PromptManager.tsx`: A UI for editing prompts. When used for a brand, it only modifies the `prompts.rules` object.

---

## 4. Summary of Refactoring Journey

The current advanced settings system was achieved through several key refactoring steps:

1.  **API Consolidation:** The initial, inefficient `load-ai-services` endpoint was replaced with the comprehensive `load-settings-data` endpoint to improve performance.
2.  **Database Migration:** The database schema was simplified by merging the `aiServices` and `aiModels` collections into a single, more maintainable `aiModels` collection.
3.  **Prompt Externalization:** All hardcoded AI prompts were removed from the service layer and centralized into a `prompts` object within the `Settings` type.
4.  **Two-Tiered Architecture:** The data model was refactored to separate global **prompt templates** (managed by admins) from brand-specific **prompt rules** (managed by users). The backend logic (`create-or-update-brand` and `save-settings`) was updated to enforce this separation, preventing data duplication and ensuring a clean inheritance model.

---

## 5. Feature: Dynamic Prompt Management

A major enhancement to the settings system is the ability to configure, override, and manage every AI prompt used in the application. This moves the core "secret sauce" of the AI's behavior from hardcoded strings into a manageable, user-facing feature.

### 5.1. Data Model & Defaults

-   **`types.ts`:** The main `Settings` interface contains a `prompts` property. In the context of `adminSettings`, this is a large, nested object with all prompt templates. In the context of a brand's `settings`, this object should only contain the `rules`.
-   **`api/lib/defaultPrompts.js`:** A file that acts as the source of truth for the default prompt structures.
-   **Backend Merging:** When the administrator saves their global settings, the backend performs a **deep merge** of their saved settings against this `defaultPrompts.js` file. This ensures that the `adminSettings` document in the database is always complete.

### 5.2. Backend AI Service Refactoring

-   All AI service functions in `api/gemini.js` (e.g., `auto-generate-persona`) were refactored to accept the `settings` object in the request body and dynamically construct the final prompt using the templates from `settings.prompts`.

### 5.3. Frontend Implementation

-   **Service Layer (`geminiService.ts`, `textGenerationService.ts`):** All functions that initiate an AI generation task were refactored to accept both `brandSettings` and `adminSettings`. They pass this information down to the prompt builder, which is responsible for combining them.
-   **`PromptManager.tsx` Component:** A sophisticated component for editing prompts. It can show a side-by-side comparison of a brand's custom rules against the inherited global default templates.
-   **UI Integration:** The `PromptManager` is rendered in two places:
    1.  **`AdminPage.tsx`:** Under a "Prompt Management" tab, allowing the administrator to edit the global default prompts for all users.
    2.  **`SettingsModal.tsx`:** Under a "Prompts" tab, allowing an individual brand to view the global defaults and edit their own specific `rules`.