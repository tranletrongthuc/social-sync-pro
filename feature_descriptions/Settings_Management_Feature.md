# Feature: Advanced Settings Management

**Version:** 2.0
**Date:** 2025-09-05
**Status:** Implemented

---

## 1. Overview

This document describes the hierarchical settings system in SocialSync Pro. The system is designed to provide a powerful and flexible way to manage application configurations, allowing a global administrator to set default values while giving individual brands the autonomy to customize their own experience.

The core principle is **inheritance with overrides**. A brand inherits all its settings from a global default configuration. However, any setting a brand explicitly customizes is saved as a specific override, which will not be affected by future changes to the global defaults.

## 2. Key Concepts & Data Flow

The settings flow is designed to be intuitive and robust, ensuring consistency for new brands while providing flexibility for existing ones.

**1. Global Admin Configuration:**
-   **Source of Truth:** An administrator uses the **Admin Page** (`/admin`) to define the application's global default settings.
-   **Database:** These settings are stored as a single document in the `adminSettings` MongoDB collection. This includes default language, default AI models, visual style templates, and other core configurations.
-   **AI Model Management:** The admin also manages a unified list of all available AI models in the `aiModels` collection. This list populates the dropdowns available to all users.

**2. Brand Initialization & Inheritance:**
-   **New Brands:** When a new brand is created, the backend automatically performs a one-time **copy** of the current global `adminSettings`. This copied set becomes the brand's own initial settings.
-   **Runtime Behavior:** When the application needs a setting for a brand, it reads the value from the brand's own saved `settings` object.

**3. Brand-Specific Customization:**
-   **The Settings Modal:** A user opens the `SettingsModal` to customize their brand's configuration.
-   **Loading Data:** The modal fetches two sets of data in a single, efficient API call (`load-settings-data`):
    1.  The brand's specific, currently saved `settings` object.
    2.  The complete global `adminSettings` object.
-   **Display Logic:** The modal displays the brand's specific setting. The `SettingField` component compares this to the global default to determine if the value is "Customized".
-   **Saving Changes:** When a user saves a change, that value is written to the brand's specific `settings` object in the `brands` collection, overwriting its previous value.

**4. The "Opt-In" Update Flow:**
-   **Impact of Admin Changes:** When an admin updates a global default (e.g., changes the recommended `imageGenerationModel`), existing brands are **not** affected because they have their own copy of the settings.
-   **Dynamic Dropdowns:** However, the *new* global default value immediately becomes visible inside the `SettingsModal` for all brands. The `SettingField` component will show a "Default" option in the dropdown reflecting the new global value.
-   **User Action:** This allows a user to see that a new global default is available and consciously "opt-in" to it by selecting it from the dropdown, which then saves it as their new brand-specific setting.

---

## 3. Technical Implementation Details

### 3.1. Database Schema (MongoDB)

-   `adminSettings` **(Collection):** A single-document collection storing the global default `Settings` object.
-   `aiModels` **(Collection):** A unified collection of all available AI models. Each document contains the model name, provider, capabilities, and the service it belongs to (e.g., "Google", "Cloudflare"). This replaced the previous, less efficient two-collection schema (`aiServices` and `aiModels`).
-   `brands` **(Collection):** Each brand document contains an embedded `settings: {}` object. This object stores the brand's complete set of settings, initially copied from the global defaults.

### 3.2. Backend API (`api/mongodb.js`)

-   `create-or-update-brand`: When this action is called for a new brand (i.e., no `brandId` is provided), the backend now automatically fetches the document from `adminSettings` and saves it as the initial `settings` object for the new brand.
-   `load-settings-data`: A consolidated action that efficiently fetches both the `adminSettings` and the full list of `aiModels` in parallel for populating the settings modal.
-   `save-admin-defaults`: The action used by the Admin Page to update the global `adminSettings` document.
-   `save-settings`: The action used to save a brand's custom overrides into the `settings` object within that brand's document.

### 3.3. Frontend Components

-   `App.tsx`: The main component orchestrates the settings logic. It loads the brand-specific settings into its state and passes them to the modal. The logic has been corrected to ensure brand settings are correctly loaded and not overwritten by global settings.
-   `SettingsModal.tsx`: The primary UI for settings. It dynamically fetches all required data when opened and uses the `SettingField` component to render each setting.
-   `SettingField.tsx`: A reusable component that:
    -   Displays the brand's current setting value.
    -   Shows a "Customized" badge if the brand's value differs from the global default.
    -   Dynamically populates dropdowns with available options, including an option to select the current global "Default" value.
-   `AdminPage.tsx`: The UI for managing global `adminSettings` and the unified `aiModels` list. This page was refactored to remove separate service/model management and now uses a single table for all AI models.

---

## 4. Summary of Refactoring Journey

The current advanced settings system was achieved through several key refactoring steps:

1.  **API Consolidation:** The initial, inefficient `load-ai-services` endpoint was replaced with the comprehensive `load-settings-data` endpoint to improve performance.
2.  **Database Migration:** The database schema was simplified by merging the `aiServices` and `aiModels` collections into a single, more maintainable `aiModels` collection. A migration script (`scripts/migrate-ai-models.js`) was created and executed to handle this data transition.
3.  **Bug Fixes & Logic Correction:**
    -   A critical bug was resolved where the `SettingsModal` would incorrectly display global settings instead of brand-specific settings. This was fixed by correcting the data flow logic in `App.tsx`.
    -   The brand creation logic was corrected in the backend to ensure that every new brand receives a copy of the current global settings upon creation, fulfilling the specified requirement.